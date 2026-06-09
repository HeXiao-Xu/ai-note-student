package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
)

type NoteAIService struct {
	noteRepo    *repository.NoteRepository
	courseRepo  *repository.CourseRepository
	llmProvider LLMProvider
}

func NewNoteAIService(noteRepo *repository.NoteRepository, courseRepo *repository.CourseRepository, llmProvider LLMProvider) *NoteAIService {
	return &NoteAIService{
		noteRepo:    noteRepo,
		courseRepo:  courseRepo,
		llmProvider: llmProvider,
	}
}

type QuickNotesResponse struct {
	NoteID    uint   `json:"note_id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
}

func (s *NoteAIService) GenerateQuickNotes(ctx context.Context, userID uint, noteID uint) (*QuickNotesResponse, error) {
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
		return nil, errors.New("note content is empty, cannot generate quick notes")
	}

	// Get course name
	courseName := ""
	if note.CourseID > 0 {
		course, err := s.courseRepo.FindByID(note.CourseID)
		if err == nil {
			courseName = course.Name
		}
	}

	// Render prompt
	prompt := RenderPrompt(PromptQuickNotes, PromptData{
		"CourseName":  courseName,
		"NoteTitle":   note.Title,
		"NoteContent": noteContent,
	})

	// Call LLM
	quickContent, err := s.llmProvider.Chat(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("LLM call failed: %w", err)
	}

	// Save as a new note with is_exam_focus=true
	quickNote := &model.Note{
		UserID:      userID,
		CourseID:    note.CourseID,
		Title:       fmt.Sprintf("【速记】%s", note.Title),
		Content:     quickContent,
		Tags:        model.StringList{"速记版"},
		IsExamFocus: true,
	}

	if err := s.noteRepo.Create(quickNote); err != nil {
		return nil, fmt.Errorf("failed to save quick notes: %w", err)
	}

	return &QuickNotesResponse{
		NoteID:  quickNote.ID,
		Title:   quickNote.Title,
		Content: quickNote.Content,
	}, nil
}
