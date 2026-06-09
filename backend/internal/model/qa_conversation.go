package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type QAConversation struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"index;not null" json:"user_id"`
	SessionID     uint      `gorm:"index" json:"session_id"`
	CourseID      uint      `gorm:"index" json:"course_id"`
	Question      string    `gorm:"type:text;not null" json:"question"`
	Answer        string    `gorm:"type:text" json:"answer"`
	SourceNoteIDs IntList   `gorm:"type:jsonb;default:'[]'" json:"source_note_ids"`
	SourceInfo    JSONMap   `gorm:"type:jsonb;default:'{}'" json:"source_info"`
	CreatedAt     time.Time `json:"created_at"`
}

// SourceInfo structure for JSON serialization
type ConversationSourceInfo struct {
	SourceNotes    []SourceNoteInfo `json:"source_notes"`
	SourceEntities []SourceEntityInfo `json:"source_entities"`
}

type SourceNoteInfo struct {
	ID        uint    `json:"id"`
	Title     string  `json:"title"`
	Relevance float64 `json:"relevance"`
}

type SourceEntityInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// JSONMap is a custom type for JSONB storage
type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}
	bytes, err := json.Marshal(j)
	return string(bytes), err
}

func (j *JSONMap) Scan(value any) error {
	if value == nil {
		*j = JSONMap{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	}
	return json.Unmarshal(bytes, j)
}
