package model

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type KnowledgeEntity struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	UserID      uint             `gorm:"index;not null" json:"user_id"`
	CourseID    uint             `gorm:"index;not null" json:"course_id"`
	Name        string           `gorm:"size:200;not null" json:"name"`
	Type        string           `gorm:"size:50;not null" json:"type"` // concept/definition/formula/theorem
	Description string           `gorm:"type:text" json:"description"`
	NoteIDs     IntList          `gorm:"type:jsonb;default:'[]'" json:"note_ids"`
	Embedding   *pgvector.Vector `gorm:"type:vector(1024)" json:"-"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}
