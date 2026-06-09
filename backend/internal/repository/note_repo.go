package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type NoteRepository struct {
	db *gorm.DB
}

func NewNoteRepository(db *gorm.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

func (r *NoteRepository) Create(note *model.Note) error {
	return r.db.Create(note).Error
}

func (r *NoteRepository) FindByID(id uint) (*model.Note, error) {
	var note model.Note
	if err := r.db.First(&note, id).Error; err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *NoteRepository) FindByCourseID(courseID uint) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.Where("course_id = ?", courseID).Order("updated_at DESC").Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) FindByUserID(userID uint) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.Where("user_id = ?", userID).Order("updated_at DESC").Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) Update(note *model.Note) error {
	return r.db.Save(note).Error
}

func (r *NoteRepository) Delete(id uint) error {
	return r.db.Delete(&model.Note{}, id).Error
}

func (r *NoteRepository) DeleteByCourseID(courseID uint) error {
	return r.db.Where("course_id = ?", courseID).Delete(&model.Note{}).Error
}

func (r *NoteRepository) Search(userID uint, query string) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.Where("user_id = ? AND (title ILIKE ? OR content ILIKE ?)", userID, "%"+query+"%", "%"+query+"%").
		Order("updated_at DESC").
		Find(&notes).Error
	return notes, err
}

// FindByIDs returns notes matching the given IDs
func (r *NoteRepository) FindByIDs(ids []uint) ([]model.Note, error) {
	if len(ids) == 0 {
		return []model.Note{}, nil
	}
	var notes []model.Note
	err := r.db.Where("id IN ?", ids).Find(&notes).Error
	return notes, err
}

// UpdateEmbedding updates the embedding vector for a note
func (r *NoteRepository) UpdateEmbedding(id uint, embedding pgvector.Vector) error {
	return r.db.Model(&model.Note{}).Where("id = ?", id).Update("embedding", embedding).Error
}

// FindNotesWithoutEmbedding finds notes that don't have embeddings yet
func (r *NoteRepository) FindNotesWithoutEmbedding(userID uint) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.Where("user_id = ? AND embedding IS NULL", userID).Find(&notes).Error
	return notes, err
}

// NoteWithScore is a note with a similarity score
type NoteWithScore struct {
	model.Note
	Score float64
}

// SearchByEmbedding searches notes by embedding similarity using pgvector
func (r *NoteRepository) SearchByEmbedding(userID uint, embedding pgvector.Vector, limit int) ([]NoteWithScore, error) {
	var results []NoteWithScore
	rows, err := r.db.Raw(`
		SELECT id, user_id, course_id, title, content, file_content, tags, is_exam_focus, created_at, updated_at,
		       1 - (embedding <=> ?) AS score
		FROM notes
		WHERE user_id = ? AND embedding IS NOT NULL
		ORDER BY embedding <=> ?
		LIMIT ?
	`, embedding, userID, embedding, limit).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var n NoteWithScore
		rows.Scan(&n.ID, &n.UserID, &n.CourseID, &n.Title, &n.Content, &n.FileContent, &n.Tags, &n.IsExamFocus, &n.CreatedAt, &n.UpdatedAt, &n.Score)
		results = append(results, n)
	}
	return results, nil
}
