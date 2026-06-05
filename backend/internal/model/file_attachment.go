package model

import "time"

type FileAttachment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	NoteID    uint      `gorm:"index;not null" json:"note_id"`
	FileName  string    `gorm:"size:255;not null" json:"file_name"`
	FileType  string    `gorm:"size:20;not null" json:"file_type"`
	ObjectKey string    `gorm:"size:500;not null" json:"object_key"`
	FileSize  int64     `gorm:"default:0" json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
}
