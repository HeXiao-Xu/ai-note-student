package service

import "context"

// DocumentParser defines the interface for document parsing implementations
type DocumentParser interface {
	Parse(ctx context.Context, data []byte) (*ParseResult, error)
}

// ParseResult holds the extracted text from a document
type ParseResult struct {
	Text       string   `json:"text"`
	Pages      []string `json:"pages,omitempty"`
	Title      string   `json:"title,omitempty"`
	PageCount  int      `json:"page_count,omitempty"`
}
