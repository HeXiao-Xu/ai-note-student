package service

import "context"

// OCRProvider defines the interface for OCR implementations
type OCRProvider interface {
	Recognize(ctx context.Context, imageData []byte, ext string) (*OCRResult, error)
}

// OCRResult holds the recognized text and optional LaTeX
type OCRResult struct {
	Text      string   `json:"text"`
	LaTeX     string   `json:"latex,omitempty"`
	Paragraphs []string `json:"paragraphs,omitempty"`
}
