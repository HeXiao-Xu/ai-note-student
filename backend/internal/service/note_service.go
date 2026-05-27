package service

import (
	"errors"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"gorm.io/gorm"
)

type NoteService struct {
	noteRepo   *repository.NoteRepository
	courseRepo *repository.CourseRepository
}

func NewNoteService(noteRepo *repository.NoteRepository, courseRepo *repository.CourseRepository) *NoteService {
	return &NoteService{noteRepo: noteRepo, courseRepo: courseRepo}
}

type CreateNoteRequest struct {
	Title    string   `json:"title" binding:"required,min=1,max=200"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags"`
}

type UpdateNoteRequest struct {
	Title    string   `json:"title" binding:"max=200"`
	Content  *string  `json:"content"`
	Tags     []string `json:"tags"`
}

func (s *NoteService) ListByCourse(userID uint, courseID uint) ([]model.Note, error) {
	// Verify course belongs to user
	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.UserID != userID {
		return nil, errors.New("permission denied")
	}
	return s.noteRepo.FindByCourseID(courseID)
}

func (s *NoteService) ListByUser(userID uint) ([]model.Note, error) {
	return s.noteRepo.FindByUserID(userID)
}

func (s *NoteService) Create(userID uint, courseID uint, req CreateNoteRequest) (*model.Note, error) {
	// Verify course belongs to user
	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.UserID != userID {
		return nil, errors.New("permission denied")
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	note := &model.Note{
		UserID:   userID,
		CourseID: courseID,
		Title:    req.Title,
		Content:  req.Content,
		Tags:     model.StringList(tags),
	}
	if err := s.noteRepo.Create(note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *NoteService) Get(userID uint, noteID uint) (*model.Note, error) {
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}
	if note.UserID != userID {
		return nil, errors.New("permission denied")
	}
	return note, nil
}

func (s *NoteService) Update(userID uint, noteID uint, req UpdateNoteRequest) (*model.Note, error) {
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}
	if note.UserID != userID {
		return nil, errors.New("permission denied")
	}

	if req.Title != "" {
		note.Title = req.Title
	}
	if req.Content != nil {
		note.Content = *req.Content
	}
	if req.Tags != nil {
		note.Tags = model.StringList(req.Tags)
	}

	if err := s.noteRepo.Update(note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *NoteService) Delete(userID uint, noteID uint) error {
	note, err := s.noteRepo.FindByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("note not found")
		}
		return err
	}
	if note.UserID != userID {
		return errors.New("permission denied")
	}
	return s.noteRepo.Delete(noteID)
}

func (s *NoteService) Search(userID uint, query string) ([]model.Note, error) {
	return s.noteRepo.Search(userID, query)
}
