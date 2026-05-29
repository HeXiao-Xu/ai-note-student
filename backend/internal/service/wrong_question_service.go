package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path/filepath"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/google/uuid"
)

type WrongQuestionService struct {
	wqRepo      *repository.WrongQuestionRepository
	noteRepo    *repository.NoteRepository
	minio       *MinIOClient
	llmProvider LLMProvider
}

func NewWrongQuestionService(wqRepo *repository.WrongQuestionRepository, noteRepo *repository.NoteRepository, minio *MinIOClient, llmProvider LLMProvider) *WrongQuestionService {
	return &WrongQuestionService{
		wqRepo:      wqRepo,
		noteRepo:    noteRepo,
		minio:       minio,
		llmProvider: llmProvider,
	}
}

// DTOs
type CreateWrongQuestionRequest struct {
	NoteID    *uint  `json:"note_id"`
	Question  string `json:"question" binding:"required"`
	Answer    string `json:"answer"`
	MyAnswer  string `json:"my_answer"`
	ErrorType string `json:"error_type"`
}

type UpdateWrongQuestionRequest struct {
	Question  *string `json:"question"`
	Answer    *string `json:"answer"`
	MyAnswer  *string `json:"my_answer"`
	ErrorType *string `json:"error_type"`
	Mastery   *int    `json:"mastery"`
}

type WrongQuestionDTO struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	NoteID    *uint  `json:"note_id"`
	Question  string `json:"question"`
	Answer    string `json:"answer"`
	MyAnswer  string `json:"my_answer"`
	ErrorType string `json:"error_type"`
	ImageURL  string `json:"image_url"`
	Mastery   int    `json:"mastery"`
	Analysis  string `json:"analysis"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type ListWrongQuestionsResponse struct {
	Items    []WrongQuestionDTO `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"page_size"`
}

type AnalysisResponse struct {
	RootCause     string   `json:"root_cause"`
	KnowledgeGaps []string `json:"knowledge_gaps"`
	Suggestion    string   `json:"suggestion"`
}

type llmAnalysisResult struct {
	RootCause     string   `json:"root_cause"`
	KnowledgeGaps []string `json:"knowledge_gaps"`
	Suggestion    string   `json:"suggestion"`
}

func toWrongQuestionDTO(wq *model.WrongQuestion) WrongQuestionDTO {
	return WrongQuestionDTO{
		ID:        wq.ID,
		UserID:    wq.UserID,
		NoteID:    wq.NoteID,
		Question:  wq.Question,
		Answer:    wq.Answer,
		MyAnswer:  wq.MyAnswer,
		ErrorType: wq.ErrorType,
		ImageURL:  wq.ImageURL,
		Mastery:   wq.Mastery,
		Analysis:  wq.Analysis,
		CreatedAt: wq.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: wq.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func (s *WrongQuestionService) Create(userID uint, req CreateWrongQuestionRequest) (*WrongQuestionDTO, error) {
	// Validate note_id if provided
	if req.NoteID != nil && *req.NoteID > 0 {
		note, err := s.noteRepo.FindByID(*req.NoteID)
		if err != nil {
			return nil, errors.New("note not found")
		}
		if note.UserID != userID {
			return nil, errors.New("permission denied")
		}
	} else {
		req.NoteID = nil
	}

	wq := &model.WrongQuestion{
		UserID:    userID,
		NoteID:    req.NoteID,
		Question:  req.Question,
		Answer:    req.Answer,
		MyAnswer:  req.MyAnswer,
		ErrorType: req.ErrorType,
		Mastery:   0,
	}

	if err := s.wqRepo.Create(wq); err != nil {
		return nil, err
	}

	dto := toWrongQuestionDTO(wq)
	return &dto, nil
}

func (s *WrongQuestionService) List(userID uint, opts repository.ListOptions) (*ListWrongQuestionsResponse, error) {
	items, total, err := s.wqRepo.FindByUserID(userID, opts)
	if err != nil {
		return nil, err
	}

	dtos := make([]WrongQuestionDTO, len(items))
	for i := range items {
		dtos[i] = toWrongQuestionDTO(&items[i])
	}

	page := opts.Page
	if page < 1 {
		page = 1
	}
	pageSize := opts.PageSize
	if pageSize < 1 {
		pageSize = 20
	}

	return &ListWrongQuestionsResponse{
		Items:    dtos,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *WrongQuestionService) Get(userID uint, id uint) (*WrongQuestionDTO, error) {
	wq, err := s.wqRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("wrong question not found")
	}
	if wq.UserID != userID {
		return nil, errors.New("permission denied")
	}
	dto := toWrongQuestionDTO(wq)
	return &dto, nil
}

func (s *WrongQuestionService) Update(userID uint, id uint, req UpdateWrongQuestionRequest) (*WrongQuestionDTO, error) {
	wq, err := s.wqRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("wrong question not found")
	}
	if wq.UserID != userID {
		return nil, errors.New("permission denied")
	}

	if req.Question != nil {
		wq.Question = *req.Question
	}
	if req.Answer != nil {
		wq.Answer = *req.Answer
	}
	if req.MyAnswer != nil {
		wq.MyAnswer = *req.MyAnswer
	}
	if req.ErrorType != nil {
		wq.ErrorType = *req.ErrorType
	}
	if req.Mastery != nil {
		if *req.Mastery < 0 {
			*req.Mastery = 0
		}
		if *req.Mastery > 5 {
			*req.Mastery = 5
		}
		wq.Mastery = *req.Mastery
	}

	if err := s.wqRepo.Update(wq); err != nil {
		return nil, err
	}

	dto := toWrongQuestionDTO(wq)
	return &dto, nil
}

func (s *WrongQuestionService) Delete(userID uint, id uint) error {
	wq, err := s.wqRepo.FindByID(id)
	if err != nil {
		return errors.New("wrong question not found")
	}
	if wq.UserID != userID {
		return errors.New("permission denied")
	}
	return s.wqRepo.Delete(id)
}

func (s *WrongQuestionService) UploadImage(ctx context.Context, userID uint, id uint, fileName string, reader io.Reader, size int64) (*WrongQuestionDTO, error) {
	wq, err := s.wqRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("wrong question not found")
	}
	if wq.UserID != userID {
		return nil, errors.New("permission denied")
	}

	ext := filepath.Ext(fileName)
	objectKey := fmt.Sprintf("wrong-questions/%d/%s%s", userID, uuid.New().String(), ext)

	if err := s.minio.Upload(ctx, objectKey, reader, size, "image/"+ext[1:]); err != nil {
		return nil, fmt.Errorf("upload failed: %w", err)
	}

	wq.ImageURL = objectKey
	if err := s.wqRepo.Update(wq); err != nil {
		return nil, err
	}

	dto := toWrongQuestionDTO(wq)
	return &dto, nil
}

func (s *WrongQuestionService) Analyze(ctx context.Context, userID uint, id uint) (*AnalysisResponse, error) {
	wq, err := s.wqRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("wrong question not found")
	}
	if wq.UserID != userID {
		return nil, errors.New("permission denied")
	}

	prompt := RenderPrompt(PromptWrongQuestionAnalysis, PromptData{
		"Question":  wq.Question,
		"Answer":    wq.Answer,
		"MyAnswer":  wq.MyAnswer,
		"ErrorType": wq.ErrorType,
	})

	raw, err := s.llmProvider.Chat(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM call failed: %w", err)
	}

	jsonStr := extractJSON(raw)
	var result llmAnalysisResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	// Save analysis to wrong question
	analysisJSON, _ := json.Marshal(result)
	wq.Analysis = string(analysisJSON)
	s.wqRepo.Update(wq)

	return &AnalysisResponse{
		RootCause:     result.RootCause,
		KnowledgeGaps: result.KnowledgeGaps,
		Suggestion:    result.Suggestion,
	}, nil
}
