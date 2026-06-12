package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type NoteService struct {
	noteRepo          *repository.NoteRepository
	courseRepo        *repository.CourseRepository
	minio             *MinIOClient
	docConverter      *DocumentConverter
	textExtractor     *TextExtractor
	embeddingProvider EmbeddingProvider
}

func NewNoteService(
	noteRepo *repository.NoteRepository,
	courseRepo *repository.CourseRepository,
	minio *MinIOClient,
	docConverter *DocumentConverter,
	textExtractor *TextExtractor,
	embeddingProvider EmbeddingProvider,
) *NoteService {
	return &NoteService{
		noteRepo:          noteRepo,
		courseRepo:        courseRepo,
		minio:             minio,
		docConverter:      docConverter,
		textExtractor:     textExtractor,
		embeddingProvider: embeddingProvider,
	}
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

	// Save uploaded file to temp file for processing
	tmpFile, err := os.CreateTemp("", "import_*"+ext)
	if err != nil {
		return nil, fmt.Errorf("create temp file: %w", err)
	}
	tmpFilePath := tmpFile.Name()
	defer os.Remove(tmpFilePath)

	if _, err := io.Copy(tmpFile, reader); err != nil {
		tmpFile.Close()
		return nil, fmt.Errorf("write temp file: %w", err)
	}
	tmpFile.Close()

	// Upload original file to MinIO: imports/{user_id}/{course_id}/{uuid}.{ext}
	objectKey := fmt.Sprintf("imports/%d/%d/%s%s", userID, courseID, uuid.New().String(), ext)
	contentType := contentTypeForExt(ext)

	// Re-open temp file for upload
	uploadFile, err := os.Open(tmpFilePath)
	if err != nil {
		return nil, fmt.Errorf("open temp file for upload: %w", err)
	}
	if err := s.minio.Upload(ctx, objectKey, uploadFile, fileSize, contentType); err != nil {
		uploadFile.Close()
		return nil, fmt.Errorf("upload to storage: %w", err)
	}
	uploadFile.Close()

	// For PPTX/DOCX, convert to PDF for preview
	var pdfObjectKey string
	if ext != ".pdf" && s.docConverter != nil && s.docConverter.IsAvailable() {
		pdfPath, err := s.docConverter.ConvertToPDF(ctx, tmpFilePath, ext)
		if err == nil {
			defer os.RemoveAll(filepath.Dir(pdfPath)) // Clean up temp dir
			// Upload PDF to MinIO
			pdfObjectKey = fmt.Sprintf("imports/%d/%d/%s.pdf", userID, courseID, uuid.New().String())
			pdfFile, err := os.Open(pdfPath)
			if err == nil {
				pdfStat, _ := pdfFile.Stat()
				if err := s.minio.Upload(ctx, pdfObjectKey, pdfFile, pdfStat.Size(), "application/pdf"); err != nil {
					pdfObjectKey = "" // Reset if upload fails
				}
				pdfFile.Close()
			}
		}
	}

	// Extract text content for RAG
	var fileContent string
	if s.textExtractor != nil {
		text, err := s.textExtractor.ExtractFromFile(ctx, tmpFilePath, ext)
		if err == nil && text != "" {
			fileContent = text
		}
	}

	// Create note with file info
	title := strings.TrimSuffix(fileName, filepath.Ext(fileName))
	note := &model.Note{
		UserID:        userID,
		CourseID:      courseID,
		Title:         title,
		FileType:      fileType,
		FileObjectKey: objectKey,
		PdfObjectKey:  pdfObjectKey,
		FileContent:   fileContent,
		Tags:          model.StringList{},
	}
	if err := s.noteRepo.Create(note); err != nil {
		_ = s.minio.Delete(ctx, objectKey)
		if pdfObjectKey != "" {
			_ = s.minio.Delete(ctx, pdfObjectKey)
		}
		return nil, err
	}

	// Generate embedding for the imported document
	s.generateEmbedding(context.Background(), note)

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

	// Generate embedding for the new note
	s.generateEmbedding(context.Background(), note)

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

	// Regenerate embedding when content changes
	if req.Content != nil || req.Title != "" {
		s.generateEmbedding(context.Background(), note)
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

// PreviewDocument returns PDF for preview (uses converted PDF for PPTX/DOCX)
func (s *NoteService) PreviewDocument(ctx context.Context, userID uint, noteID uint) (io.ReadCloser, *model.Note, error) {
	note, err := s.Get(userID, noteID)
	if err != nil {
		return nil, nil, err
	}
	if note.FileObjectKey == "" {
		return nil, nil, errors.New("note has no document")
	}

	// For PPTX/DOCX with converted PDF, serve the PDF version
	objectKey := note.FileObjectKey
	if note.PdfObjectKey != "" {
		objectKey = note.PdfObjectKey
	}

	obj, err := s.minio.Download(ctx, objectKey)
	if err != nil {
		return nil, nil, fmt.Errorf("download from storage: %w", err)
	}
	return obj, note, nil
}

func (s *NoteService) generateEmbedding(ctx context.Context, note *model.Note) {
	content := noteContent(note)
	if content == "" {
		return
	}
	text := note.Title + ": " + truncateContent(content, 500)
	embeddings, err := s.embeddingProvider.Embed(ctx, []string{text})
	if err != nil {
		log.Printf("Failed to generate embedding for note %d: %v", note.ID, err)
		return
	}
	if len(embeddings) > 0 {
		vec := pgvector.NewVector(embeddings[0])
		if err := s.noteRepo.UpdateEmbedding(note.ID, vec); err != nil {
			log.Printf("Failed to save embedding for note %d: %v", note.ID, err)
		}
	}
}

func noteContent(note *model.Note) string {
	if note.Content != "" {
		return note.Content
	}
	return note.FileContent
}
