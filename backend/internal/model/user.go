package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email        string    `gorm:"uniqueIndex;size:100;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Avatar       string    `gorm:"size:255" json:"avatar"`
	CreatedAt    time.Time `json:"created_at"`
}
