package model

import "time"

type QAConversation struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"index;not null" json:"user_id"`
	CourseID      uint      `gorm:"index" json:"course_id"`
	Question      string    `gorm:"type:text;not null" json:"question"`
	Answer        string    `gorm:"type:text;not null" json:"answer"`
	SourceNoteIDs IntList   `gorm:"type:jsonb;default:'[]'" json:"source_note_ids"`
	CreatedAt     time.Time `json:"created_at"`
}
