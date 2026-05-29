package service

import (
	"bytes"
	"context"
	"fmt"

	"github.com/ledongthuc/pdf"
)

type PDFParser struct{}

func NewPDFParser() *PDFParser {
	return &PDFParser{}
}

func (p *PDFParser) Parse(ctx context.Context, data []byte) (*ParseResult, error) {
	reader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open PDF: %w", err)
	}

	pageCount := reader.NumPage()
	var pages []string

	for i := 1; i <= pageCount; i++ {
		page := reader.Page(i)
		text, err := page.GetPlainText(nil)
		if err != nil {
			continue
		}
		pages = append(pages, text)
	}

	var fullText string
	for i, p := range pages {
		if i > 0 {
			fullText += "\n\n"
		}
		fullText += p
	}

	return &ParseResult{
		Text:      fullText,
		Pages:     pages,
		PageCount: pageCount,
	}, nil
}
