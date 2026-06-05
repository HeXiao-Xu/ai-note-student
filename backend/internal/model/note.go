package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/pgvector/pgvector-go"
)

type Note struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	UserID        uint             `gorm:"index;not null" json:"user_id"`
	CourseID      uint             `gorm:"index;not null" json:"course_id"`
	Title         string           `gorm:"size:200;not null" json:"title"`
	Content       string           `gorm:"type:text" json:"content"`
	Tags          StringList       `gorm:"type:jsonb;default:'[]'" json:"tags"`
	IsExamFocus   bool             `gorm:"default:false" json:"is_exam_focus"`
	FileType      string           `gorm:"size:20;default:''" json:"file_type"`
	FileObjectKey string           `gorm:"size:500;default:''" json:"file_object_key"`
	Embedding     *pgvector.Vector `gorm:"type:vector(1024)" json:"-"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

// StringList is a custom type for JSONB string arrays
type StringList []string

func (s StringList) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	return string(bytes), err
}

func (s *StringList) Scan(value any) error {
	if value == nil {
		*s = StringList{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	}
	return json.Unmarshal(bytes, s)
}
