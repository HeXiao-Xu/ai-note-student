package handler

import (
	"net/http"
	"strconv"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ExamPointHandler struct {
	examPointService *service.ExamPointService
}

func NewExamPointHandler(examPointService *service.ExamPointService) *ExamPointHandler {
	return &ExamPointHandler{examPointService: examPointService}
}

func (h *ExamPointHandler) ListByNote(c *gin.Context) {
	userID := c.GetUint("user_id")
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid note id"})
		return
	}

	points, err := h.examPointService.ListByNote(userID, uint(noteID))
	if err != nil {
		if err.Error() == "note not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "permission denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, points)
}

func (h *ExamPointHandler) Analyze(c *gin.Context) {
	userID := c.GetUint("user_id")
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid note id"})
		return
	}

	result, err := h.examPointService.Analyze(c.Request.Context(), userID, uint(noteID))
	if err != nil {
		if err.Error() == "note not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "permission denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
