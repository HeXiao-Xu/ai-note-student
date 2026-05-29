package model

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	// Enable pgvector extension before creating tables
	db.Exec("CREATE EXTENSION IF NOT EXISTS vector")

	if err := db.AutoMigrate(&User{}, &Course{}, &Note{}, &FileAttachment{}, &ExamPoint{}, &WrongQuestion{}, &ReviewPlan{}); err != nil {
		return nil, fmt.Errorf("migrate database: %w", err)
	}

	// Create composite index for review plans
	db.Exec("CREATE INDEX IF NOT EXISTS idx_review_plans_user_next ON review_plans (user_id, next_review_at)")

	return db, nil
}
