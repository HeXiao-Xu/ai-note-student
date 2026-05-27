package main

import (
	"log"

	"github.com/ai-note-student/backend/internal/config"
	"github.com/ai-note-student/backend/internal/model"
)

func main() {
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	db, err := model.InitDB(cfg.Database.DSN())
	if err != nil {
		log.Fatalf("init database: %v", err)
	}

	log.Printf("Database connected, starting server on :%s", cfg.Server.Port)

	// Router will be added in Task 7
	_ = db
	select {}
}
