package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type ListOptions struct {
	Page      int
	PageSize  int
	ErrorType string
}

type WrongQuestionRepository struct {
	db *gorm.DB
}

func NewWrongQuestionRepository(db *gorm.DB) *WrongQuestionRepository {
	return &WrongQuestionRepository{db: db}
}

func (r *WrongQuestionRepository) Create(wq *model.WrongQuestion) error {
	return r.db.Create(wq).Error
}

func (r *WrongQuestionRepository) FindByID(id uint) (*model.WrongQuestion, error) {
	var wq model.WrongQuestion
	err := r.db.First(&wq, id).Error
	return &wq, err
}

func (r *WrongQuestionRepository) FindByUserID(userID uint, opts ListOptions) ([]model.WrongQuestion, int64, error) {
	query := r.db.Where("user_id = ?", userID)
	if opts.ErrorType != "" {
		query = query.Where("error_type = ?", opts.ErrorType)
	}

	var total int64
	if err := query.Model(&model.WrongQuestion{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.WrongQuestion
	page := opts.Page
	if page < 1 {
		page = 1
	}
	pageSize := opts.PageSize
	if pageSize < 1 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&items).Error
	return items, total, err
}

func (r *WrongQuestionRepository) FindByNoteID(noteID uint) ([]model.WrongQuestion, error) {
	var items []model.WrongQuestion
	err := r.db.Where("note_id = ?", noteID).Order("created_at DESC").Find(&items).Error
	return items, err
}

func (r *WrongQuestionRepository) Update(wq *model.WrongQuestion) error {
	return r.db.Save(wq).Error
}

func (r *WrongQuestionRepository) Delete(id uint) error {
	return r.db.Delete(&model.WrongQuestion{}, id).Error
}

func (r *WrongQuestionRepository) CountByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.WrongQuestion{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *WrongQuestionRepository) CountByErrorType(userID uint) (map[string]int, error) {
	type result struct {
		ErrorType string
		Count     int
	}
	var results []result
	err := r.db.Model(&model.WrongQuestion{}).
		Select("error_type, count(*) as count").
		Where("user_id = ?", userID).
		Group("error_type").
		Find(&results).Error
	if err != nil {
		return nil, err
	}
	m := make(map[string]int)
	for _, r := range results {
		m[r.ErrorType] = r.Count
	}
	return m, nil
}

func (r *WrongQuestionRepository) FindByUserIDAndMastery(userID uint, mastery int) ([]model.WrongQuestion, error) {
	var items []model.WrongQuestion
	err := r.db.Where("user_id = ? AND mastery = ?", userID, mastery).Find(&items).Error
	return items, err
}
