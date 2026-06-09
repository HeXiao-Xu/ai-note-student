package model

import "time"

type QASession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	CourseID  uint      `gorm:"index" json:"course_id"`
	Title     string    `gorm:"size:200" json:"title"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
