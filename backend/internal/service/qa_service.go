package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/pgvector/pgvector-go"
)

type QAService struct {
	qaRepo            *repository.QARepository
	noteRepo          *repository.NoteRepository
	knowledgeRepo     *repository.KnowledgeRepository
	llmProvider       LLMProvider
	embeddingProvider EmbeddingProvider
}

func NewQAService(
	qaRepo *repository.QARepository,
	noteRepo *repository.NoteRepository,
	knowledgeRepo *repository.KnowledgeRepository,
	llmProvider LLMProvider,
	embeddingProvider EmbeddingProvider,
) *QAService {
	return &QAService{
		qaRepo:            qaRepo,
		noteRepo:          noteRepo,
		knowledgeRepo:     knowledgeRepo,
		llmProvider:       llmProvider,
		embeddingProvider: embeddingProvider,
	}
}

// AskResult is the result of a RAG QA query
type AskResult struct {
	Answer         string         `json:"answer"`
	SourceNotes    []SourceNote   `json:"source_notes"`
	SourceEntities []SourceEntity `json:"source_entities"`
	SessionID      uint           `json:"session_id"`
}

type SourceNote struct {
	ID        uint    `json:"id"`
	Title     string  `json:"title"`
	Relevance float64 `json:"relevance"`
}

type SourceEntity struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// Ask performs RAG-based question answering
func (s *QAService) Ask(userID uint, question string, courseID uint, sessionID uint) (*AskResult, error) {
	var contextParts []string
	var sourceNotes []SourceNote
	var sourceEntities []SourceEntity

	// Create or validate session
	if sessionID == 0 {
		// Create new session
		title := question
		if len(title) > 30 {
			title = title[:30] + "..."
		}
		session := &model.QASession{
			UserID:   userID,
			CourseID: courseID,
			Title:    title,
		}
		if err := s.qaRepo.CreateSession(session); err != nil {
			return nil, fmt.Errorf("failed to create session: %w", err)
		}
		sessionID = session.ID
	} else {
		// Validate session ownership
		session, err := s.qaRepo.FindSessionByID(sessionID)
		if err != nil || session.UserID != userID {
			return nil, fmt.Errorf("session not found or permission denied")
		}
		// Update session timestamp
		s.qaRepo.UpdateSession(session)
	}

	// Step 1: Generate embedding for the question
	embeddings, embErr := s.embeddingProvider.Embed(context.Background(), []string{question})

	if embErr == nil && len(embeddings) > 0 {
		queryVec := pgvector.NewVector(embeddings[0])

		// Lazy-generate embeddings for notes without them
		s.generateMissingEmbeddings(userID)

		// Step 2: Search for similar notes
		noteResults, err := s.noteRepo.SearchByEmbedding(userID, queryVec, courseID, 5)
		if err == nil {
			for _, nr := range noteResults {
				content := nr.Content
				if content == "" {
					content = nr.FileContent
				}
				contextParts = append(contextParts, fmt.Sprintf("【笔记: %s】\n%s", nr.Title, truncateContent(content, 500)))
				sourceNotes = append(sourceNotes, SourceNote{
					ID:        nr.ID,
					Title:     nr.Title,
					Relevance: nr.Score,
				})
			}
		}

		// Step 3: Search for similar entities
		entityResults, err := s.knowledgeRepo.SearchByEmbedding(userID, queryVec, courseID, 3)
		if err == nil {
			for _, er := range entityResults {
				contextParts = append(contextParts, fmt.Sprintf("【知识: %s (%s)】\n%s", er.Name, er.Type, er.Description))
				sourceEntities = append(sourceEntities, SourceEntity{
					ID:   er.ID,
					Name: er.Name,
					Type: er.Type,
				})
			}
		}
	}

	// Step 4: Build context
	contextStr := "暂无相关参考资料"
	if len(contextParts) > 0 {
		contextStr = strings.Join(contextParts, "\n\n")
	} else {
		contextStr = "未找到相关参考资料，请根据你的知识回答。"
	}

	// Step 5: Call LLM
	prompt := RenderPrompt(PromptRAGQA, PromptData{
		"Context":  contextStr,
		"Question": question,
	})

	answer, err := s.llmProvider.Chat(context.Background(), prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM 生成回答失败: %w", err)
	}

	// Step 6: Save to history
	sourceNoteIDs := make(model.IntList, len(sourceNotes))
	for i, sn := range sourceNotes {
		sourceNoteIDs[i] = int(sn.ID)
	}

	// Build source info for frontend display
	sourceInfo := model.JSONMap{
		"source_notes":    sourceNotes,
		"source_entities": sourceEntities,
	}

	conversation := model.QAConversation{
		UserID:        userID,
		SessionID:     sessionID,
		CourseID:      courseID,
		Question:      question,
		Answer:        answer,
		SourceNoteIDs: sourceNoteIDs,
		SourceInfo:    sourceInfo,
	}
	s.qaRepo.Create(&conversation)

	return &AskResult{
		Answer:         answer,
		SourceNotes:    sourceNotes,
		SourceEntities: sourceEntities,
		SessionID:      sessionID,
	}, nil
}

// ListSessions returns QA sessions for a user
func (s *QAService) ListSessions(userID uint, courseID uint) ([]model.QASession, error) {
	return s.qaRepo.FindSessionsByUserID(userID, courseID)
}

// GetSessionMessages returns all conversations in a session
func (s *QAService) GetSessionMessages(sessionID uint, userID uint) ([]model.QAConversation, error) {
	session, err := s.qaRepo.FindSessionByID(sessionID)
	if err != nil || session.UserID != userID {
		return nil, fmt.Errorf("session not found or permission denied")
	}
	return s.qaRepo.FindBySessionID(sessionID)
}

// DeleteSession deletes a session and all its conversations
func (s *QAService) DeleteSession(sessionID uint, userID uint) error {
	session, err := s.qaRepo.FindSessionByID(sessionID)
	if err != nil || session.UserID != userID {
		return fmt.Errorf("session not found or permission denied")
	}
	return s.qaRepo.DeleteSession(sessionID)
}

// RenameSession renames a session
func (s *QAService) RenameSession(sessionID uint, userID uint, title string) error {
	session, err := s.qaRepo.FindSessionByID(sessionID)
	if err != nil || session.UserID != userID {
		return fmt.Errorf("session not found or permission denied")
	}
	session.Title = title
	return s.qaRepo.UpdateSession(session)
}

// generateMissingEmbeddings lazily generates embeddings for notes that don't have them
func (s *QAService) generateMissingEmbeddings(userID uint) {
	notes, err := s.noteRepo.FindNotesWithoutEmbedding(userID)
	if err != nil || len(notes) == 0 {
		return
	}

	// Batch embed (limit to 20 at a time)
	if len(notes) > 20 {
		notes = notes[:20]
	}

	texts := make([]string, len(notes))
	for i, n := range notes {
		content := n.Content
		if content == "" {
			content = n.FileContent
		}
		texts[i] = n.Title + ": " + truncateContent(content, 500)
	}

	embeddings, err := s.embeddingProvider.Embed(context.Background(), texts)
	if err != nil {
		log.Printf("Failed to generate embeddings: %v", err)
		return
	}

	for i, n := range notes {
		if i < len(embeddings) {
			vec := pgvector.NewVector(embeddings[i])
			s.noteRepo.UpdateEmbedding(n.ID, vec)
		}
	}
}
