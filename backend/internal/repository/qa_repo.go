package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type QARepository struct {
	db *gorm.DB
}

func NewQARepository(db *gorm.DB) *QARepository {
	return &QARepository{db: db}
}

func (r *QARepository) Create(conversation *model.QAConversation) error {
	return r.db.Create(conversation).Error
}

func (r *QARepository) FindByUserID(userID uint, courseID uint) ([]model.QAConversation, error) {
	var conversations []model.QAConversation
	query := r.db.Where("user_id = ?", userID)
	if courseID > 0 {
		query = query.Where("course_id = ?", courseID)
	}
	err := query.Order("created_at DESC").Limit(100).Find(&conversations).Error
	return conversations, err
}

func (r *QARepository) FindByID(id uint) (*model.QAConversation, error) {
	var conversation model.QAConversation
	if err := r.db.First(&conversation, id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}
