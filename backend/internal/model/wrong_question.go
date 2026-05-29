package model

import "time"

type WrongQuestion struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	NoteID    *uint     `gorm:"index" json:"note_id"`
	Question  string    `gorm:"type:text;not null" json:"question"`
	Answer    string    `gorm:"type:text" json:"answer"`
	MyAnswer  string    `gorm:"type:text" json:"my_answer"`
	ErrorType string    `gorm:"size:50" json:"error_type"` // 计算/概念/审题/记忆/其他
	ImageURL  string    `gorm:"size:500" json:"image_url"`
	Mastery   int       `gorm:"default:0" json:"mastery"` // 0-5
	Analysis  string    `gorm:"type:text" json:"analysis"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
