package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type ExamPointRepository struct {
	db *gorm.DB
}

func NewExamPointRepository(db *gorm.DB) *ExamPointRepository {
	return &ExamPointRepository{db: db}
}

func (r *ExamPointRepository) FindByNoteID(noteID uint) ([]model.ExamPoint, error) {
	var points []model.ExamPoint
	err := r.db.Where("note_id = ?", noteID).Order("created_at DESC").Find(&points).Error
	return points, err
}

func (r *ExamPointRepository) FindByID(id uint) (*model.ExamPoint, error) {
	var point model.ExamPoint
	err := r.db.First(&point, id).Error
	return &point, err
}

func (r *ExamPointRepository) Create(point *model.ExamPoint) error {
	return r.db.Create(point).Error
}

func (r *ExamPointRepository) CreateBatch(points []model.ExamPoint) error {
	return r.db.Create(&points).Error
}

func (r *ExamPointRepository) DeleteByNoteID(noteID uint) error {
	return r.db.Where("note_id = ?", noteID).Delete(&model.ExamPoint{}).Error
}

func (r *ExamPointRepository) Delete(id uint) error {
	return r.db.Delete(&model.ExamPoint{}, id).Error
}
