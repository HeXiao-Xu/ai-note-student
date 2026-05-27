package repository

import (
	"github.com/ai-note-student/backend/internal/model"
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

func (r *NoteRepository) Search(userID uint, query string) ([]model.Note, error) {
	var notes []model.Note
	err := r.db.Where("user_id = ? AND (title ILIKE ? OR content ILIKE ?)", userID, "%"+query+"%", "%"+query+"%").
		Order("updated_at DESC").
		Find(&notes).Error
	return notes, err
}
