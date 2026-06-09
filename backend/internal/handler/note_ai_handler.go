package handler

import (
	"net/http"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type NoteAIHandler struct {
	noteAIService *service.NoteAIService
}

func NewNoteAIHandler(noteAIService *service.NoteAIService) *NoteAIHandler {
	return &NoteAIHandler{noteAIService: noteAIService}
}

func (h *NoteAIHandler) GenerateQuickNotes(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		NoteID uint `json:"note_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note_id is required"})
		return
	}

	result, err := h.noteAIService.GenerateQuickNotes(c.Request.Context(), userID, req.NoteID)
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
