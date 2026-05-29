package model

import "time"

type ReviewPlan struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	NoteID       uint      `gorm:"index;not null" json:"note_id"`
	RefType      string    `gorm:"size:20;not null" json:"ref_type"` // "exam_point" | "wrong_question"
	RefID        uint      `gorm:"not null" json:"ref_id"`
	NextReviewAt time.Time `gorm:"index;not null" json:"next_review_at"`
	IntervalDays int       `gorm:"default:1" json:"interval_days"`
	ReviewCount  int       `gorm:"default:0" json:"review_count"`
	EaseFactor   float64   `gorm:"default:2.5" json:"ease_factor"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
