package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type FileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) *FileRepository {
	return &FileRepository{db: db}
}

func (r *FileRepository) Create(file *model.FileAttachment) error {
	return r.db.Create(file).Error
}

func (r *FileRepository) FindByID(id uint) (*model.FileAttachment, error) {
	var file model.FileAttachment
	if err := r.db.First(&file, id).Error; err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *FileRepository) FindByNoteID(noteID uint) ([]model.FileAttachment, error) {
	var files []model.FileAttachment
	err := r.db.Where("note_id = ?", noteID).Order("created_at DESC").Find(&files).Error
	return files, err
}

func (r *FileRepository) Update(file *model.FileAttachment) error {
	return r.db.Save(file).Error
}

func (r *FileRepository) Delete(id uint) error {
	return r.db.Delete(&model.FileAttachment{}, id).Error
}

func (r *FileRepository) DeleteByNoteID(noteID uint) error {
	return r.db.Where("note_id = ?", noteID).Delete(&model.FileAttachment{}).Error
}
