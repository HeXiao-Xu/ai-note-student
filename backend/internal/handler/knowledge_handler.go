package handler

import (
	"net/http"
	"strconv"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type KnowledgeHandler struct {
	knowledgeService *service.KnowledgeService
}

func NewKnowledgeHandler(knowledgeService *service.KnowledgeService) *KnowledgeHandler {
	return &KnowledgeHandler{knowledgeService: knowledgeService}
}

func (h *KnowledgeHandler) ListEntities(c *gin.Context) {
	userID := c.GetUint("user_id")
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 32)

	entities, err := h.knowledgeService.ListEntities(userID, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entities)
}

func (h *KnowledgeHandler) ExtractEntities(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		NoteID uint `json:"note_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note_id is required"})
		return
	}

	entities, err := h.knowledgeService.ExtractEntities(userID, req.NoteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entities)
}

func (h *KnowledgeHandler) GetGraphData(c *gin.Context) {
	userID := c.GetUint("user_id")
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 32)

	graphData, err := h.knowledgeService.GetGraphData(userID, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, graphData)
}

func (h *KnowledgeHandler) AddRelation(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		SourceID     uint   `json:"source_id" binding:"required"`
		TargetID     uint   `json:"target_id" binding:"required"`
		RelationType string `json:"type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "source_id, target_id and type are required"})
		return
	}

	if err := h.knowledgeService.AddRelation(userID, req.SourceID, req.TargetID, req.RelationType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "关系添加成功"})
}

func (h *KnowledgeHandler) GetRelatedEntities(c *gin.Context) {
	userID := c.GetUint("user_id")
	entityID, err := strconv.ParseUint(c.Param("entityId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity id"})
		return
	}

	entities, err := h.knowledgeService.GetRelatedEntities(userID, uint(entityID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entities)
}
