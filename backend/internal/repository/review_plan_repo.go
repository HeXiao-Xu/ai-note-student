package repository

import (
	"time"

	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type ReviewPlanRepository struct {
	db *gorm.DB
}

func NewReviewPlanRepository(db *gorm.DB) *ReviewPlanRepository {
	return &ReviewPlanRepository{db: db}
}

func (r *ReviewPlanRepository) Create(plan *model.ReviewPlan) error {
	return r.db.Create(plan).Error
}

func (r *ReviewPlanRepository) FindByID(id uint) (*model.ReviewPlan, error) {
	var plan model.ReviewPlan
	err := r.db.First(&plan, id).Error
	return &plan, err
}

func (r *ReviewPlanRepository) FindTodayByUserID(userID uint) ([]model.ReviewPlan, error) {
	var plans []model.ReviewPlan
	err := r.db.Where("user_id = ? AND next_review_at <= ?", userID, time.Now()).
		Order("next_review_at ASC").
		Find(&plans).Error
	return plans, err
}

func (r *ReviewPlanRepository) FindByUserAndRef(userID uint, refType string, refID uint) (*model.ReviewPlan, error) {
	var plan model.ReviewPlan
	err := r.db.Where("user_id = ? AND ref_type = ? AND ref_id = ?", userID, refType, refID).First(&plan).Error
	return &plan, err
}

func (r *ReviewPlanRepository) Update(plan *model.ReviewPlan) error {
	return r.db.Save(plan).Error
}

func (r *ReviewPlanRepository) Delete(id uint) error {
	return r.db.Delete(&model.ReviewPlan{}, id).Error
}

func (r *ReviewPlanRepository) CountByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.ReviewPlan{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *ReviewPlanRepository) CountDueByUserID(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.ReviewPlan{}).
		Where("user_id = ? AND next_review_at <= ?", userID, time.Now()).
		Count(&count).Error
	return count, err
}

func (r *ReviewPlanRepository) CountCompletedTodayByUserID(userID uint) (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	err := r.db.Model(&model.ReviewPlan{}).
		Where("user_id = ? AND last_answered_at >= ? AND last_answered_at < ?", userID, today, tomorrow).
		Count(&count).Error
	return count, err
}

// DailyCount holds a daily review count
type DailyCount struct {
	Date  time.Time
	Count int64
}

// FindRecentReviewCounts returns review counts for the last N days
func (r *ReviewPlanRepository) FindRecentReviewCounts(userID uint, days int) ([]DailyCount, error) {
	startDate := time.Now().AddDate(0, 0, -days+1).Truncate(24 * time.Hour)

	var results []DailyCount
	err := r.db.Model(&model.ReviewPlan{}).
		Select("DATE(last_answered_at) as date, count(*) as count").
		Where("user_id = ? AND last_answered_at >= ?", userID, startDate).
		Group("DATE(last_answered_at)").
		Find(&results).Error

	return results, err
}
