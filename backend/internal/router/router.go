package router

import (
	"github.com/ai-note-student/backend/internal/handler"
	"github.com/ai-note-student/backend/internal/middleware"
	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func Setup(
	authService *service.AuthService,
	courseService *service.CourseService,
	noteService *service.NoteService,
	fileService *service.FileService,
	examPointService *service.ExamPointService,
	noteAIService *service.NoteAIService,
	wrongQuestionService *service.WrongQuestionService,
	reviewService *service.ReviewService,
) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	authHandler := handler.NewAuthHandler(authService)
	courseHandler := handler.NewCourseHandler(courseService)
	noteHandler := handler.NewNoteHandler(noteService)
	fileHandler := handler.NewFileHandler(fileService)
	examPointHandler := handler.NewExamPointHandler(examPointService)
	noteAIHandler := handler.NewNoteAIHandler(noteAIService)
	wrongQuestionHandler := handler.NewWrongQuestionHandler(wrongQuestionService)
	reviewHandler := handler.NewReviewHandler(reviewService)

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", middleware.AuthMiddleware(authService), authHandler.Refresh)
	}

	api := r.Group("/api", middleware.AuthMiddleware(authService))
	{
		courses := api.Group("/courses")
		{
			courses.GET("", courseHandler.List)
			courses.POST("", courseHandler.Create)
			courses.PUT("/:id", courseHandler.Update)
			courses.DELETE("/:id", courseHandler.Delete)

			courses.GET("/:courseId/notes", noteHandler.ListByCourse)
			courses.POST("/:courseId/notes", noteHandler.Create)
		}

		notes := api.Group("/notes")
		{
			notes.GET("", noteHandler.ListAll)
			notes.GET("/search", noteHandler.Search)
			notes.GET("/:id", noteHandler.Get)
			notes.PUT("/:id", noteHandler.Update)
			notes.DELETE("/:id", noteHandler.Delete)

			// File routes on notes
			notes.POST("/:id/files", fileHandler.Upload)
			notes.GET("/:id/files", fileHandler.ListByNote)

			// Exam point routes on notes
			notes.GET("/:id/exam-points", examPointHandler.ListByNote)
			notes.POST("/:id/exam-points", examPointHandler.Analyze)
		}

		// File routes
		files := api.Group("/files")
		{
			files.GET("/:id/download", fileHandler.Download)
			files.DELETE("/:id", fileHandler.Delete)
			files.POST("/:id/ocr", fileHandler.TriggerOCR)
			files.POST("/:id/parse", fileHandler.TriggerParse)
		}

		// Quick notes generation
		api.POST("/exam-points/generate-quick", noteAIHandler.GenerateQuickNotes)

		// Wrong questions
		wrongQuestions := api.Group("/wrong-questions")
		{
			wrongQuestions.GET("", wrongQuestionHandler.List)
			wrongQuestions.POST("", wrongQuestionHandler.Create)
			wrongQuestions.GET("/:id", wrongQuestionHandler.Get)
			wrongQuestions.PUT("/:id", wrongQuestionHandler.Update)
			wrongQuestions.DELETE("/:id", wrongQuestionHandler.Delete)
			wrongQuestions.POST("/:id/image", wrongQuestionHandler.UploadImage)
			wrongQuestions.POST("/:id/analyze", wrongQuestionHandler.Analyze)
		}

		// Reviews
		reviews := api.Group("/reviews")
		{
			reviews.GET("/today", reviewHandler.GetTodayReviews)
			reviews.GET("/stats", reviewHandler.GetStats)
			reviews.GET("/detailed-stats", reviewHandler.GetDetailedStats)
			reviews.POST("/:id/answer", reviewHandler.AnswerReview)
		}
	}

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
