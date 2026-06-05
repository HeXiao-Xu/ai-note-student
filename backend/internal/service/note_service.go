package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NoteService struct {
	noteRepo   *repository.NoteRepository
	courseRepo *repository.CourseRepository
	minio      *MinIOClient
}

func NewNoteService(noteRepo *repository.NoteRepository, courseRepo *repository.CourseRepository, minio *MinIOClient) *NoteService {
	return &NoteService{noteRepo: noteRepo, courseRepo: courseRepo, minio: minio}
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

var noteImportExtensions = map[string]bool{
	".pdf":  true,
	".pptx": true,
	".docx": true,
}

func (s *NoteService) ImportDocument(ctx context.Context, userID uint, courseID uint, fileName string, fileSize int64, reader io.Reader) (*model.Note, error) {
	// Verify course belongs to user
	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.UserID != userID {
		return nil, errors.New("permission denied")
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileName))
	if !noteImportExtensions[ext] {
		return nil, fmt.Errorf("file type %s is not allowed for import", ext)
	}

	// Determine file type
	fileType := ""
	switch ext {
	case ".pdf":
		fileType = "pdf"
	case ".pptx":
		fileType = "pptx"
	case ".docx":
		fileType = "docx"
	}

	// Upload to MinIO: imports/{user_id}/{course_id}/{uuid}.{ext}
	objectKey := fmt.Sprintf("imports/%d/%d/%s%s", userID, courseID, uuid.New().String(), ext)
	contentType := contentTypeForExt(ext)
	if err := s.minio.Upload(ctx, objectKey, reader, fileSize, contentType); err != nil {
		return nil, fmt.Errorf("upload to storage: %w", err)
	}

	// Create note with file info
	title := strings.TrimSuffix(fileName, filepath.Ext(fileName))
	note := &model.Note{
		UserID:        userID,
		CourseID:      courseID,
		Title:         title,
		FileType:      fileType,
		FileObjectKey: objectKey,
		Tags:          model.StringList{},
	}
	if err := s.noteRepo.Create(note); err != nil {
		_ = s.minio.Delete(ctx, objectKey)
		return nil, err
	}

	return note, nil
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

func (s *NoteService) DownloadDocument(ctx context.Context, userID uint, noteID uint) (io.ReadCloser, *model.Note, error) {
	note, err := s.Get(userID, noteID)
	if err != nil {
		return nil, nil, err
	}
	if note.FileObjectKey == "" {
		return nil, nil, errors.New("note has no document")
	}
	obj, err := s.minio.Download(ctx, note.FileObjectKey)
	if err != nil {
		return nil, nil, fmt.Errorf("download from storage: %w", err)
	}
	return obj, note, nil
}
