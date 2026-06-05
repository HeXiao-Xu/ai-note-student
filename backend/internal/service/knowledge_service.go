package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/pgvector/pgvector-go"
)

type KnowledgeService struct {
	knowledgeRepo     *repository.KnowledgeRepository
	noteRepo          *repository.NoteRepository
	courseRepo        *repository.CourseRepository
	llmProvider       LLMProvider
	embeddingProvider EmbeddingProvider
}

func NewKnowledgeService(
	knowledgeRepo *repository.KnowledgeRepository,
	noteRepo *repository.NoteRepository,
	courseRepo *repository.CourseRepository,
	llmProvider LLMProvider,
	embeddingProvider EmbeddingProvider,
) *KnowledgeService {
	return &KnowledgeService{
		knowledgeRepo:     knowledgeRepo,
		noteRepo:          noteRepo,
		courseRepo:        courseRepo,
		llmProvider:       llmProvider,
		embeddingProvider: embeddingProvider,
	}
}

// GraphData represents the graph data for ECharts visualization
type GraphData struct {
	Nodes      []GraphNode   `json:"nodes"`
	Edges      []GraphEdge   `json:"edges"`
	Categories []GraphCategory `json:"categories"`
}

type GraphNode struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	SymbolSize int    `json:"symbolSize"`
	Category   int    `json:"category"`
}

type GraphEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
}

type GraphCategory struct {
	Name string `json:"name"`
}

// RelatedEntity represents a related entity with similarity score
type RelatedEntity struct {
	model.KnowledgeEntity
	RelationType string  `json:"relation_type,omitempty"`
	Score        float64 `json:"score,omitempty"`
}

// ListEntities returns entities filtered by user and optionally by course
func (s *KnowledgeService) ListEntities(userID uint, courseID uint) ([]model.KnowledgeEntity, error) {
	return s.knowledgeRepo.FindEntitiesByUserID(userID, courseID)
}

// ExtractEntities extracts knowledge entities from a note using LLM, then infers relations
func (s *KnowledgeService) ExtractEntities(userID uint, noteID uint) ([]model.KnowledgeEntity, error) {
	// Get note content with permission check
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		return nil, fmt.Errorf("笔记不存在")
	}
	if note.UserID != userID {
		return nil, fmt.Errorf("无权访问此笔记")
	}

	// Get course name for prompt
	courseName := ""
	course, err := s.courseRepo.FindByID(note.CourseID)
	if err == nil {
		courseName = course.Name
	}

	// Call LLM to extract entities
	prompt := RenderPrompt(PromptEntityExtract, PromptData{
		"CourseName":  courseName,
		"NoteTitle":   note.Title,
		"NoteContent": truncateContent(note.Content, 3000),
	})

	raw, err := s.llmProvider.Chat(context.Background(), prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM 提取实体失败: %w", err)
	}

	// Parse JSON response
	jsonStr := extractJSON(raw)
	var entityResults []struct {
		Name        string `json:"name"`
		Type        string `json:"type"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal([]byte(jsonStr), &entityResults); err != nil {
		return nil, fmt.Errorf("解析实体结果失败: %w", err)
	}

	if len(entityResults) == 0 {
		return nil, fmt.Errorf("未提取到实体")
	}

	// Delete old entities for this note (idempotent)
	s.knowledgeRepo.DeleteEntitiesByNoteID(userID, int(noteID))

	// Generate embeddings for entities
	texts := make([]string, len(entityResults))
	for i, e := range entityResults {
		texts[i] = e.Name + ": " + e.Description
	}

	embeddings, embErr := s.embeddingProvider.Embed(context.Background(), texts)

	// Create entities
	entities := make([]model.KnowledgeEntity, len(entityResults))
	for i, e := range entityResults {
		entity := model.KnowledgeEntity{
			UserID:      userID,
			CourseID:    note.CourseID,
			Name:        e.Name,
			Type:        normalizeEntityType(e.Type),
			Description: e.Description,
			NoteIDs:     model.IntList{int(noteID)},
		}
		if embErr == nil && i < len(embeddings) {
			vec := pgvector.NewVector(embeddings[i])
			entity.Embedding = &vec
		}
		entities[i] = entity
	}

	if err := s.knowledgeRepo.CreateEntities(entities); err != nil {
		return nil, fmt.Errorf("保存实体失败: %w", err)
	}

	// Infer relations between all entities in the same course
	go s.inferRelations(note.CourseID)

	return s.knowledgeRepo.FindEntitiesByUserID(userID, note.CourseID)
}

// inferRelations infers relations between entities in a course (runs asynchronously)
func (s *KnowledgeService) inferRelations(courseID uint) {
	entities, err := s.knowledgeRepo.FindEntitiesByCourseID(courseID)
	if err != nil || len(entities) < 2 {
		return
	}

	// Build entity list string for prompt
	var sb strings.Builder
	for _, e := range entities {
		sb.WriteString(fmt.Sprintf("- %s (%s): %s\n", e.Name, e.Type, e.Description))
	}

	prompt := RenderPrompt(PromptRelationInfer, PromptData{
		"Entities": sb.String(),
	})

	raw, err := s.llmProvider.Chat(context.Background(), prompt)
	if err != nil {
		log.Printf("LLM infer relations failed: %v", err)
		return
	}

	jsonStr := extractJSON(raw)
	var relationResults []struct {
		Source string `json:"source"`
		Target string `json:"target"`
		Type   string `json:"type"`
	}
	if err := json.Unmarshal([]byte(jsonStr), &relationResults); err != nil {
		log.Printf("Parse relation results failed: %v", err)
		return
	}

	// Build name -> entity ID map
	nameToID := make(map[string]uint)
	for _, e := range entities {
		nameToID[e.Name] = e.ID
	}

	// Delete existing relations for this course and create new ones
	entityIDs := make([]uint, len(entities))
	for i, e := range entities {
		entityIDs[i] = e.ID
	}
	s.knowledgeRepo.DeleteRelationsByEntityIDs(entityIDs)

	var relations []model.KnowledgeRelation
	for _, r := range relationResults {
		sourceID, ok1 := nameToID[r.Source]
		targetID, ok2 := nameToID[r.Target]
		if !ok1 || !ok2 || sourceID == targetID {
			continue
		}
		relations = append(relations, model.KnowledgeRelation{
			SourceID: sourceID,
			TargetID: targetID,
			Type:     normalizeRelationType(r.Type),
		})
	}

	if len(relations) > 0 {
		s.knowledgeRepo.CreateRelations(relations)
	}
}

// GetGraphData returns graph data for ECharts visualization
func (s *KnowledgeService) GetGraphData(userID uint, courseID uint) (*GraphData, error) {
	entities, err := s.knowledgeRepo.FindEntitiesByUserID(userID, courseID)
	if err != nil {
		return nil, err
	}

	if len(entities) == 0 {
		return &GraphData{
			Nodes:      []GraphNode{},
			Edges:      []GraphEdge{},
			Categories: getDefaultCategories(),
		}, nil
	}

	// Get entity IDs for relation query
	entityIDs := make([]uint, len(entities))
	for i, e := range entities {
		entityIDs[i] = e.ID
	}

	relations, err := s.knowledgeRepo.FindRelationsByEntityIDs(entityIDs)
	if err != nil {
		return nil, err
	}

	// Count edges per node for symbolSize
	edgeCount := make(map[uint]int)
	for _, r := range relations {
		edgeCount[r.SourceID]++
		edgeCount[r.TargetID]++
	}

	// Build nodes
	typeToCategory := map[string]int{
		"concept":    0,
		"definition": 1,
		"formula":    2,
		"theorem":    3,
	}

	nodes := make([]GraphNode, len(entities))
	for i, e := range entities {
		cat := typeToCategory[e.Type]
		if cat == 0 && e.Type != "concept" {
			cat = 0
		}
		size := 25 + edgeCount[e.ID]*5
		if size > 60 {
			size = 60
		}
		nodes[i] = GraphNode{
			ID:         e.ID,
			Name:       e.Name,
			Type:       e.Type,
			SymbolSize: size,
			Category:   cat,
		}
	}

	// Build edges
	edges := make([]GraphEdge, len(relations))
	for i, r := range relations {
		edges[i] = GraphEdge{
			Source: fmt.Sprintf("%d", r.SourceID),
			Target: fmt.Sprintf("%d", r.TargetID),
			Type:   r.Type,
		}
	}

	return &GraphData{
		Nodes:      nodes,
		Edges:      edges,
		Categories: getDefaultCategories(),
	}, nil
}

// AddRelation manually adds a relation between two entities
func (s *KnowledgeService) AddRelation(userID uint, sourceID uint, targetID uint, relationType string) error {
	// Verify both entities belong to the user
	source, err := s.knowledgeRepo.FindEntityByID(sourceID)
	if err != nil || source.UserID != userID {
		return fmt.Errorf("源实体不存在或无权访问")
	}
	target, err := s.knowledgeRepo.FindEntityByID(targetID)
	if err != nil || target.UserID != userID {
		return fmt.Errorf("目标实体不存在或无权访问")
	}
	if sourceID == targetID {
		return fmt.Errorf("不能创建自引用关系")
	}

	relation := model.KnowledgeRelation{
		SourceID: sourceID,
		TargetID: targetID,
		Type:     normalizeRelationType(relationType),
	}
	return s.knowledgeRepo.CreateRelation(&relation)
}

// GetRelatedEntities returns entities related to the given entity
func (s *KnowledgeService) GetRelatedEntities(userID uint, entityID uint) ([]RelatedEntity, error) {
	// Verify entity belongs to user
	entity, err := s.knowledgeRepo.FindEntityByID(entityID)
	if err != nil || entity.UserID != userID {
		return nil, fmt.Errorf("实体不存在或无权访问")
	}

	// Get directly related entities via graph traversal
	relatedIDs, err := s.knowledgeRepo.FindRelatedEntityIDs(entityID)
	if err != nil {
		return nil, err
	}

	var result []RelatedEntity
	seen := map[uint]bool{entityID: true}

	// Add graph-traversal related entities
	for _, id := range relatedIDs {
		if seen[id] {
			continue
		}
		seen[id] = true
		e, err := s.knowledgeRepo.FindEntityByID(id)
		if err != nil || e.UserID != userID {
			continue
		}
		result = append(result, RelatedEntity{
			KnowledgeEntity: *e,
		})
	}

	// Add embedding-similarity related entities
	if entity.Embedding != nil {
		similar, err := s.knowledgeRepo.SearchByEmbedding(userID, *entity.Embedding, 5)
		if err == nil {
			for _, e := range similar {
				if seen[e.ID] {
					continue
				}
				seen[e.ID] = true
				result = append(result, RelatedEntity{
					KnowledgeEntity: e.KnowledgeEntity,
					Score:           e.Score,
				})
			}
		}
	}

	return result, nil
}

func getDefaultCategories() []GraphCategory {
	return []GraphCategory{
		{Name: "概念"},
		{Name: "定义"},
		{Name: "公式"},
		{Name: "定理"},
	}
}

func normalizeEntityType(t string) string {
	switch strings.ToLower(t) {
	case "concept", "概念":
		return "concept"
	case "definition", "定义":
		return "definition"
	case "formula", "公式":
		return "formula"
	case "theorem", "定理":
		return "theorem"
	default:
		return "concept"
	}
}

func normalizeRelationType(t string) string {
	switch strings.ToLower(t) {
	case "contains", "包含":
		return "contains"
	case "prerequisite", "前置依赖", "前置":
		return "prerequisite"
	case "application", "应用":
		return "application"
	default:
		return "contains"
	}
}

func truncateContent(content string, maxLen int) string {
	if len(content) <= maxLen {
		return content
	}
	return content[:maxLen] + "..."
}
