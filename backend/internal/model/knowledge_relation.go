package model

import "time"

type KnowledgeRelation struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SourceID  uint      `gorm:"index;not null" json:"source_id"`
	TargetID  uint      `gorm:"index;not null" json:"target_id"`
	Type      string    `gorm:"size:50;not null" json:"type"` // contains/prerequisite/application
	CreatedAt time.Time `json:"created_at"`
}
