package main

import (
	"log"

	"github.com/ai-note-student/backend/internal/config"
	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/ai-note-student/backend/internal/router"
	"github.com/ai-note-student/backend/internal/service"
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

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo, cfg.JWT)
	engine := router.Setup(authService)

	log.Printf("Server starting on :%s", cfg.Server.Port)
	if err := engine.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("start server: %v", err)
	}
}
