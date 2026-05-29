package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type ExamPoint struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	NoteID    uint      `gorm:"index;not null" json:"note_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	Frequency string    `gorm:"size:20;default:'中频'" json:"frequency"` // 高频/中频/低频
	Source    string    `gorm:"size:200" json:"source"`
	ExamYears IntList   `gorm:"type:jsonb;default:'[]'" json:"exam_years"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// IntList custom type for jsonb integer array
type IntList []int

func (s IntList) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	return string(bytes), err
}

func (s *IntList) Scan(value interface{}) error {
	if value == nil {
		*s = IntList{}
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
