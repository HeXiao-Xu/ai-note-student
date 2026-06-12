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
	courseRepo := repository.NewCourseRepository(db)
	noteRepo := repository.NewNoteRepository(db)
	fileRepo := repository.NewFileRepository(db)
	examPointRepo := repository.NewExamPointRepository(db)
	wqRepo := repository.NewWrongQuestionRepository(db)
	reviewPlanRepo := repository.NewReviewPlanRepository(db)
	knowledgeRepo := repository.NewKnowledgeRepository(db)
	qaRepo := repository.NewQARepository(db)

	minioClient, err := service.NewMinIOClient(cfg.MinIO)
	if err != nil {
		log.Fatalf("init minio: %v", err)
	}

	// Initialize LLM provider based on config
	var llmProvider service.LLMProvider
	var embeddingProvider service.EmbeddingProvider
	switch cfg.LLM.Provider {
	case "zhipu":
		llmProvider = service.NewZhipuLLM(cfg.LLM.Zhipu)
		embeddingProvider = service.NewZhipuEmbedding(cfg.LLM.Zhipu, cfg.LLM.EmbeddingModel)
	case "openai":
		llmProvider = service.NewOpenAILLM(cfg.LLM.OpenAI)
		embeddingProvider = service.NewOpenAIEmbedding(cfg.LLM.OpenAI, cfg.LLM.EmbeddingModel)
	case "dashscope":
		llmProvider = service.NewDashScopeLLM(cfg.LLM.DashScope)
		embeddingProvider = service.NewDashScopeEmbedding(cfg.LLM.DashScope, cfg.LLM.EmbeddingModel)
	}

	authService := service.NewAuthService(userRepo, cfg.JWT)
	courseService := service.NewCourseService(courseRepo, noteRepo)
	docConverter := service.NewDocumentConverter("")   // auto-detect LibreOffice
	textExtractor := service.NewTextExtractor("")       // auto-detect pdftotext
	noteService := service.NewNoteService(noteRepo, courseRepo, minioClient, docConverter, textExtractor, embeddingProvider)
	fileService := service.NewFileService(fileRepo, noteRepo, minioClient)
	reviewService := service.NewReviewService(reviewPlanRepo, examPointRepo, wqRepo, noteRepo)
	examPointService := service.NewExamPointService(examPointRepo, noteRepo, courseRepo, llmProvider, reviewService)
	noteAIService := service.NewNoteAIService(noteRepo, courseRepo, llmProvider)
	wrongQuestionService := service.NewWrongQuestionService(wqRepo, noteRepo, minioClient, llmProvider, reviewService)
	knowledgeService := service.NewKnowledgeService(knowledgeRepo, noteRepo, courseRepo, llmProvider, embeddingProvider)
	qaService := service.NewQAService(qaRepo, noteRepo, knowledgeRepo, llmProvider, embeddingProvider)

	engine := router.Setup(authService, courseService, noteService, fileService, examPointService, noteAIService, wrongQuestionService, reviewService, knowledgeService, qaService)

	log.Printf("Server starting on :%s", cfg.Server.Port)
	if err := engine.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("start server: %v", err)
	}
}
