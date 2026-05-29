package handler

import (
	"net/http"
	"strconv"

	"github.com/ai-note-student/backend/internal/repository"
	"github.com/ai-note-student/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type WrongQuestionHandler struct {
	wqService *service.WrongQuestionService
}

func NewWrongQuestionHandler(wqService *service.WrongQuestionService) *WrongQuestionHandler {
	return &WrongQuestionHandler{wqService: wqService}
}

func (h *WrongQuestionHandler) Create(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req service.CreateWrongQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.wqService.Create(userID, req)
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

	c.JSON(http.StatusCreated, result)
}

func (h *WrongQuestionHandler) List(c *gin.Context) {
	userID := c.GetUint("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	errorType := c.Query("error_type")

	opts := repository.ListOptions{
		Page:      page,
		PageSize:  pageSize,
		ErrorType: errorType,
	}

	result, err := h.wqService.List(userID, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *WrongQuestionHandler) Get(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result, err := h.wqService.Get(userID, uint(id))
	if err != nil {
		if err.Error() == "wrong question not found" {
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

func (h *WrongQuestionHandler) Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.UpdateWrongQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.wqService.Update(userID, uint(id), req)
	if err != nil {
		if err.Error() == "wrong question not found" {
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

func (h *WrongQuestionHandler) Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.wqService.Delete(userID, uint(id)); err != nil {
		if err.Error() == "wrong question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "permission denied" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *WrongQuestionHandler) UploadImage(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	result, err := h.wqService.UploadImage(c.Request.Context(), userID, uint(id), header.Filename, file, header.Size)
	if err != nil {
		if err.Error() == "wrong question not found" {
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

func (h *WrongQuestionHandler) Analyze(c *gin.Context) {
	userID := c.GetUint("user_id")
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result, err := h.wqService.Analyze(c.Request.Context(), userID, uint(id))
	if err != nil {
		if err.Error() == "wrong question not found" {
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
