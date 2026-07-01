package model

import "time"

// ReviewHistory records each review action (immutable)
type ReviewHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	PlanID    uint      `gorm:"index;not null" json:"plan_id"`
	RefType   string    `gorm:"size:20;not null" json:"ref_type"` // "exam_point" | "wrong_question"
	RefID     uint      `gorm:"not null" json:"ref_id"`
	Quality   int       `gorm:"not null" json:"quality"`         // 0-5 mastery rating
	CreatedAt time.Time `json:"created_at"`
}
