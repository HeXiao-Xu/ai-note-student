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

var allowedExtensions = map[string]bool{
	".pdf":  true,
	".pptx": true,
	".docx": true,
	".png":  true,
	".jpg":  true,
	".jpeg": true,
}

type FileService struct {
	fileRepo *repository.FileRepository
	noteRepo *repository.NoteRepository
	minio    *MinIOClient
}

func NewFileService(fileRepo *repository.FileRepository, noteRepo *repository.NoteRepository, minio *MinIOClient) *FileService {
	return &FileService{
		fileRepo: fileRepo,
		noteRepo: noteRepo,
		minio:    minio,
	}
}

func (s *FileService) Upload(ctx context.Context, userID uint, noteID uint, fileName string, fileSize int64, reader io.Reader) (*model.FileAttachment, error) {
	// Verify note belongs to user
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

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileName))
	if !allowedExtensions[ext] {
		return nil, fmt.Errorf("file type %s is not allowed", ext)
	}

	// Build object key: notes/{user_id}/{note_id}/{uuid}.{ext}
	objectKey := fmt.Sprintf("notes/%d/%d/%s%s", userID, noteID, uuid.New().String(), ext)

	// Determine file type category
	fileType := categorizeFile(ext)

	// Upload to MinIO
	contentType := contentTypeForExt(ext)
	if err := s.minio.Upload(ctx, objectKey, reader, fileSize, contentType); err != nil {
		return nil, fmt.Errorf("upload to storage: %w", err)
	}

	// Save record to DB
	file := &model.FileAttachment{
		NoteID:   noteID,
		FileName: fileName,
		FileType: fileType,
		ObjectKey: objectKey,
		FileSize: fileSize,
	}
	if err := s.fileRepo.Create(file); err != nil {
		// Attempt cleanup from MinIO
		_ = s.minio.Delete(ctx, objectKey)
		return nil, fmt.Errorf("save file record: %w", err)
	}

	return file, nil
}

func (s *FileService) ListByNote(userID uint, noteID uint) ([]model.FileAttachment, error) {
	// Verify note belongs to user
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

	return s.fileRepo.FindByNoteID(noteID)
}

func (s *FileService) Download(ctx context.Context, userID uint, fileID uint) (io.ReadCloser, *model.FileAttachment, error) {
	file, err := s.fileRepo.FindByID(fileID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("file not found")
		}
		return nil, nil, err
	}

	// Verify note belongs to user
	note, err := s.noteRepo.FindByID(file.NoteID)
	if err != nil {
		return nil, nil, errors.New("note not found")
	}
	if note.UserID != userID {
		return nil, nil, errors.New("permission denied")
	}

	obj, err := s.minio.Download(ctx, file.ObjectKey)
	if err != nil {
		return nil, nil, fmt.Errorf("download from storage: %w", err)
	}

	return obj, file, nil
}

func (s *FileService) Delete(ctx context.Context, userID uint, fileID uint) error {
	file, err := s.fileRepo.FindByID(fileID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("file not found")
		}
		return err
	}

	// Verify note belongs to user
	note, err := s.noteRepo.FindByID(file.NoteID)
	if err != nil {
		return errors.New("note not found")
	}
	if note.UserID != userID {
		return errors.New("permission denied")
	}

	// Delete from MinIO (ignore error, DB record is primary)
	_ = s.minio.Delete(ctx, file.ObjectKey)

	return s.fileRepo.Delete(fileID)
}

func categorizeFile(ext string) string {
	switch ext {
	case ".pdf":
		return "pdf"
	case ".pptx":
		return "pptx"
	case ".docx":
		return "docx"
	case ".png", ".jpg", ".jpeg":
		return "image"
	default:
		return "other"
	}
}

func contentTypeForExt(ext string) string {
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	default:
		return "application/octet-stream"
	}
}
