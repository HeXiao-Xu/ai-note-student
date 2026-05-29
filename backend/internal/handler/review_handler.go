package handler

import (
	"net/http"
	"strconv"

	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ReviewHandler struct {
	reviewService *service.ReviewService
}

func NewReviewHandler(reviewService *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

func (h *ReviewHandler) GetTodayReviews(c *gin.Context) {
	userID := c.GetUint("user_id")

	items, err := h.reviewService.GetTodayReviews(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (h *ReviewHandler) AnswerReview(c *gin.Context) {
	userID := c.GetUint("user_id")
	planID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plan id"})
		return
	}

	var req service.AnswerReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.reviewService.AnswerReview(userID, uint(planID), req)
	if err != nil {
		if err.Error() == "review plan not found" {
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

func (h *ReviewHandler) GetStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	stats, err := h.reviewService.GetStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *ReviewHandler) GetDetailedStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	stats, err := h.reviewService.GetDetailedStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
