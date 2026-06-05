package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type KnowledgeRepository struct {
	db *gorm.DB
}

func NewKnowledgeRepository(db *gorm.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

// Entity operations

func (r *KnowledgeRepository) CreateEntity(entity *model.KnowledgeEntity) error {
	return r.db.Create(entity).Error
}

func (r *KnowledgeRepository) CreateEntities(entities []model.KnowledgeEntity) error {
	return r.db.Create(&entities).Error
}

func (r *KnowledgeRepository) FindEntityByID(id uint) (*model.KnowledgeEntity, error) {
	var entity model.KnowledgeEntity
	if err := r.db.First(&entity, id).Error; err != nil {
		return nil, err
	}
	return &entity, nil
}

func (r *KnowledgeRepository) FindEntitiesByUserID(userID uint, courseID uint) ([]model.KnowledgeEntity, error) {
	var entities []model.KnowledgeEntity
	query := r.db.Where("user_id = ?", userID)
	if courseID > 0 {
		query = query.Where("course_id = ?", courseID)
	}
	err := query.Order("updated_at DESC").Find(&entities).Error
	return entities, err
}

func (r *KnowledgeRepository) FindEntitiesByCourseID(courseID uint) ([]model.KnowledgeEntity, error) {
	var entities []model.KnowledgeEntity
	err := r.db.Where("course_id = ?", courseID).Find(&entities).Error
	return entities, err
}

func (r *KnowledgeRepository) FindEntitiesByNoteID(noteID int) ([]model.KnowledgeEntity, error) {
	var entities []model.KnowledgeEntity
	// Query entities whose note_ids jsonb array contains the noteID
	err := r.db.Where("note_ids::jsonb @> ?::jsonb", model.IntList{noteID}).Find(&entities).Error
	if err != nil {
		// Fallback: scan all and filter in Go
		var all []model.KnowledgeEntity
		r.db.Find(&all)
		var result []model.KnowledgeEntity
		for _, e := range all {
			for _, nid := range e.NoteIDs {
				if nid == noteID {
					result = append(result, e)
					break
				}
			}
		}
		return result, nil
	}
	return entities, nil
}

func (r *KnowledgeRepository) DeleteEntitiesByNoteID(userID uint, noteID int) error {
	entities, err := r.FindEntitiesByNoteID(noteID)
	if err != nil {
		return err
	}
	for _, e := range entities {
		if e.UserID != userID {
			continue
		}
		// Delete relations involving this entity
		r.db.Where("source_id = ? OR target_id = ?", e.ID, e.ID).Delete(&model.KnowledgeRelation{})
		r.db.Delete(&e)
	}
	return nil
}

func (r *KnowledgeRepository) UpdateEntity(entity *model.KnowledgeEntity) error {
	return r.db.Save(entity).Error
}

func (r *KnowledgeRepository) DeleteEntity(id uint) error {
	r.db.Where("source_id = ? OR target_id = ?", id, id).Delete(&model.KnowledgeRelation{})
	return r.db.Delete(&model.KnowledgeEntity{}, id).Error
}

// Relation operations

func (r *KnowledgeRepository) CreateRelation(relation *model.KnowledgeRelation) error {
	return r.db.Create(relation).Error
}

func (r *KnowledgeRepository) CreateRelations(relations []model.KnowledgeRelation) error {
	return r.db.Create(&relations).Error
}

func (r *KnowledgeRepository) FindRelationsByEntityIDs(entityIDs []uint) ([]model.KnowledgeRelation, error) {
	var relations []model.KnowledgeRelation
	err := r.db.Where("source_id IN ? OR target_id IN ?", entityIDs, entityIDs).Find(&relations).Error
	return relations, err
}

func (r *KnowledgeRepository) DeleteRelationsByEntityIDs(entityIDs []uint) error {
	if len(entityIDs) == 0 {
		return nil
	}
	return r.db.Where("source_id IN ? OR target_id IN ?", entityIDs, entityIDs).Delete(&model.KnowledgeRelation{}).Error
}

func (r *KnowledgeRepository) FindRelationsByCourseID(courseID uint) ([]model.KnowledgeRelation, error) {
	// Get all entity IDs in this course
	var entityIDs []uint
	r.db.Model(&model.KnowledgeEntity{}).Where("course_id = ?", courseID).Pluck("id", &entityIDs)
	if len(entityIDs) == 0 {
		return []model.KnowledgeRelation{}, nil
	}
	return r.FindRelationsByEntityIDs(entityIDs)
}

func (r *KnowledgeRepository) FindRelatedEntityIDs(entityID uint) ([]uint, error) {
	var ids []uint
	rows, err := r.db.Raw(`
		SELECT CASE WHEN source_id = ? THEN target_id ELSE source_id END as related_id
		FROM knowledge_relations
		WHERE source_id = ? OR target_id = ?
	`, entityID, entityID, entityID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id uint
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids, nil
}

// Search entities by embedding similarity
type EntityWithScore struct {
	model.KnowledgeEntity
	Score float64
}

func (r *KnowledgeRepository) SearchByEmbedding(userID uint, embedding pgvector.Vector, limit int) ([]EntityWithScore, error) {
	var results []EntityWithScore
	rows, err := r.db.Raw(`
		SELECT id, user_id, course_id, name, type, description, note_ids, created_at, updated_at,
		       1 - (embedding <=> ?) AS score
		FROM knowledge_entities
		WHERE user_id = ? AND embedding IS NOT NULL
		ORDER BY embedding <=> ?
		LIMIT ?
	`, embedding, userID, embedding, limit).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var e EntityWithScore
		rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.Name, &e.Type, &e.Description, &e.NoteIDs, &e.CreatedAt, &e.UpdatedAt, &e.Score)
		results = append(results, e)
	}
	return results, nil
}
