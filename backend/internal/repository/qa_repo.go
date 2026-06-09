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

// Conversation methods

func (r *QARepository) Create(conversation *model.QAConversation) error {
	return r.db.Create(conversation).Error
}

func (r *QARepository) FindBySessionID(sessionID uint) ([]model.QAConversation, error) {
	var conversations []model.QAConversation
	err := r.db.Where("session_id = ?", sessionID).Order("created_at ASC").Find(&conversations).Error
	return conversations, err
}

func (r *QARepository) FindByID(id uint) (*model.QAConversation, error) {
	var conversation model.QAConversation
	if err := r.db.First(&conversation, id).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

// Session methods

func (r *QARepository) CreateSession(session *model.QASession) error {
	return r.db.Create(session).Error
}

func (r *QARepository) FindSessionsByUserID(userID uint, courseID uint) ([]model.QASession, error) {
	var sessions []model.QASession
	query := r.db.Where("user_id = ?", userID)
	if courseID > 0 {
		query = query.Where("course_id = ?", courseID)
	}
	err := query.Order("updated_at DESC").Limit(100).Find(&sessions).Error
	return sessions, err
}

func (r *QARepository) FindSessionByID(id uint) (*model.QASession, error) {
	var session model.QASession
	if err := r.db.First(&session, id).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *QARepository) UpdateSession(session *model.QASession) error {
	return r.db.Save(session).Error
}

func (r *QARepository) DeleteSession(id uint) error {
	// Delete all conversations in this session first
	r.db.Where("session_id = ?", id).Delete(&model.QAConversation{})
	return r.db.Delete(&model.QASession{}, id).Error
}
