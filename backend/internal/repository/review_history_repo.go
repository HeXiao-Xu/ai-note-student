package repository

import (
	"time"

	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type ReviewHistoryRepository struct {
	db *gorm.DB
}

func NewReviewHistoryRepository(db *gorm.DB) *ReviewHistoryRepository {
	return &ReviewHistoryRepository{db: db}
}

// Create records a new review action
func (r *ReviewHistoryRepository) Create(history *model.ReviewHistory) error {
	return r.db.Create(history).Error
}

// FindRecentCounts returns review counts for the last N days
func (r *ReviewHistoryRepository) FindRecentCounts(userID uint, days int) ([]DailyCount, error) {
	startDate := time.Now().AddDate(0, 0, -days+1).Truncate(24 * time.Hour)

	var results []DailyCount
	err := r.db.Model(&model.ReviewHistory{}).
		Select("DATE(created_at) as date, count(*) as count").
		Where("user_id = ? AND created_at >= ?", userID, startDate).
		Group("DATE(created_at)").
		Find(&results).Error

	return results, err
}

// CountCompletedToday returns count of reviews done today
func (r *ReviewHistoryRepository) CountCompletedToday(userID uint) (int64, error) {
	var count int64
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	err := r.db.Model(&model.ReviewHistory{}).
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, today, tomorrow).
		Count(&count).Error
	return count, err
}
