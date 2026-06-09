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
		Question  string `json:"question" binding:"required"`
		CourseID  uint   `json:"course_id"`
		SessionID uint   `json:"session_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question is required"})
		return
	}

	result, err := h.qaService.Ask(userID, req.Question, req.CourseID, req.SessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *QAHandler) ListSessions(c *gin.Context) {
	userID := c.GetUint("user_id")
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 32)

	sessions, err := h.qaService.ListSessions(userID, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

func (h *QAHandler) GetSessionMessages(c *gin.Context) {
	userID := c.GetUint("user_id")
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	messages, err := h.qaService.GetSessionMessages(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, messages)
}

func (h *QAHandler) DeleteSession(c *gin.Context) {
	userID := c.GetUint("user_id")
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	if err := h.qaService.DeleteSession(uint(sessionID), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *QAHandler) RenameSession(c *gin.Context) {
	userID := c.GetUint("user_id")
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var req struct {
		Title string `json:"title" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	if err := h.qaService.RenameSession(uint(sessionID), userID, req.Title); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "renamed"})
}
