package router

import (
	"github.com/ai-note-student/backend/internal/handler"
	"github.com/ai-note-student/backend/internal/middleware"
	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func Setup(authService *service.AuthService) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	authHandler := handler.NewAuthHandler(authService)

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", middleware.AuthMiddleware(authService), authHandler.Refresh)
	}

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
