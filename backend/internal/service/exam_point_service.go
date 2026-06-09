package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
)

type ExamPointService struct {
	examPointRepo *repository.ExamPointRepository
	noteRepo      *repository.NoteRepository
	courseRepo    *repository.CourseRepository
	llmProvider   LLMProvider
	reviewService *ReviewService
}

func NewExamPointService(examPointRepo *repository.ExamPointRepository, noteRepo *repository.NoteRepository, courseRepo *repository.CourseRepository, llmProvider LLMProvider, reviewService *ReviewService) *ExamPointService {
	return &ExamPointService{
		examPointRepo: examPointRepo,
		noteRepo:      noteRepo,
		courseRepo:    courseRepo,
		llmProvider:   llmProvider,
		reviewService: reviewService,
	}
}

// DTOs
type ExamPointDTO struct {
	ID        uint   `json:"id"`
	NoteID    uint   `json:"note_id"`
	Content   string `json:"content"`
	Frequency string `json:"frequency"`
	Source    string `json:"source"`
	ExamYears []int  `json:"exam_years"`
}

type AnalyzeExamPointsResponse struct {
	ExamPoints []ExamPointDTO `json:"exam_points"`
}

// llmExamPoint is used to parse LLM JSON response
type llmExamPoint struct {
	Content   string `json:"content"`
	Frequency string `json:"frequency"`
	Source    string `json:"source"`
}

func toExamPointDTO(ep *model.ExamPoint) ExamPointDTO {
	years := []int{}
	if ep.ExamYears != nil {
		years = ep.ExamYears
	}
	return ExamPointDTO{
		ID:        ep.ID,
		NoteID:    ep.NoteID,
		Content:   ep.Content,
		Frequency: ep.Frequency,
		Source:    ep.Source,
		ExamYears: years,
	}
}

func (s *ExamPointService) ListByNote(userID uint, noteID uint) ([]ExamPointDTO, error) {
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		return nil, errors.New("note not found")
	}
	if note.UserID != userID {
		return nil, errors.New("permission denied")
	}

	points, err := s.examPointRepo.FindByNoteID(noteID)
	if err != nil {
		return nil, err
	}

	dtos := make([]ExamPointDTO, len(points))
	for i := range points {
		dtos[i] = toExamPointDTO(&points[i])
	}
	return dtos, nil
}

func (s *ExamPointService) Analyze(ctx context.Context, userID uint, noteID uint) (*AnalyzeExamPointsResponse, error) {
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		return nil, errors.New("note not found")
	}
	if note.UserID != userID {
		return nil, errors.New("permission denied")
	}

	noteContent := note.Content
	if noteContent == "" {
		noteContent = note.FileContent
	}
	if noteContent == "" {
		return nil, errors.New("note content is empty, cannot analyze")
	}

	// Get course name for prompt
	courseName := ""
	if note.CourseID > 0 {
		course, err := s.courseRepo.FindByID(note.CourseID)
		if err == nil {
			courseName = course.Name
		}
	}

	// Render prompt
	prompt := RenderPrompt(PromptExamPointAnalysis, PromptData{
		"CourseName":  courseName,
		"NoteTitle":   note.Title,
		"NoteContent": noteContent,
	})

	// Call LLM
	raw, err := s.llmProvider.Chat(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM call failed: %w", err)
	}

	// Parse JSON response
	jsonStr := extractJSON(raw)
	var llmPoints []llmExamPoint
	if err := json.Unmarshal([]byte(jsonStr), &llmPoints); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w, raw: %s", err, raw)
	}

	// Clear old exam points for this note
	s.examPointRepo.DeleteByNoteID(noteID)

	// Create new exam points
	points := make([]model.ExamPoint, len(llmPoints))
	for i, lp := range llmPoints {
		points[i] = model.ExamPoint{
			NoteID:    noteID,
			Content:   lp.Content,
			Frequency: lp.Frequency,
			Source:    lp.Source,
			ExamYears: model.IntList{},
		}
	}

	if len(points) > 0 {
		if err := s.examPointRepo.CreateBatch(points); err != nil {
			return nil, fmt.Errorf("failed to save exam points: %w", err)
		}

		// Auto-create review plans for each exam point
		for _, ep := range points {
			s.reviewService.CreatePlanForExamPoint(userID, noteID, ep.ID)
		}
	}

	dtos := make([]ExamPointDTO, len(points))
	for i := range points {
		dtos[i] = toExamPointDTO(&points[i])
	}

	return &AnalyzeExamPointsResponse{ExamPoints: dtos}, nil
}
