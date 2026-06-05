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

	if err := db.AutoMigrate(&User{}, &Course{}, &Note{}, &FileAttachment{}, &ExamPoint{}, &WrongQuestion{}, &ReviewPlan{}, &KnowledgeEntity{}, &KnowledgeRelation{}, &QAConversation{}); err != nil {
		return nil, fmt.Errorf("migrate database: %w", err)
	}

	// Create composite index for review plans
	db.Exec("CREATE INDEX IF NOT EXISTS idx_review_plans_user_next ON review_plans (user_id, next_review_at)")

	// Create indexes for knowledge graph
	db.Exec("CREATE INDEX IF NOT EXISTS idx_entities_user_course ON knowledge_entities (user_id, course_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_relations_source ON knowledge_relations (source_id)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_relations_target ON knowledge_relations (target_id)")

	// Create HNSW indexes for vector similarity search
	db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes USING hnsw (embedding vector_cosine_ops)")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_entities_embedding ON knowledge_entities USING hnsw (embedding vector_cosine_ops)")

	return db, nil
}
