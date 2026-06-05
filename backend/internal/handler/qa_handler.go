package handler

import (
	"net/http"
	"strconv"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type QAHandler struct {
	qaService *service.QAService
}

func NewQAHandler(qaService *service.QAService) *QAHandler {
	return &QAHandler{qaService: qaService}
}

func (h *QAHandler) Ask(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Question string `json:"question" binding:"required"`
		CourseID uint   `json:"course_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question is required"})
		return
	}

	result, err := h.qaService.Ask(userID, req.Question, req.CourseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *QAHandler) GetHistory(c *gin.Context) {
	userID := c.GetUint("user_id")
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 32)

	conversations, err := h.qaService.GetHistory(userID, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conversations)
}
