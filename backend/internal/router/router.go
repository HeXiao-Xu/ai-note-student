package router

import (
	"github.com/ai-note-student/backend/internal/handler"
	"github.com/ai-note-student/backend/internal/middleware"
	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func Setup(authService *service.AuthService, courseService *service.CourseService, noteService *service.NoteService) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	authHandler := handler.NewAuthHandler(authService)
	courseHandler := handler.NewCourseHandler(courseService)
	noteHandler := handler.NewNoteHandler(noteService)

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
		}
	}

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
