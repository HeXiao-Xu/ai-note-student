package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"strings"
)

type DOCXParser struct{}

func NewDOCXParser() *DOCXParser {
	return &DOCXParser{}
}

func (p *DOCXParser) Parse(ctx context.Context, data []byte) (*ParseResult, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open DOCX: %w", err)
	}

	// Find word/document.xml
	var docFile *zip.File
	for _, f := range reader.File {
		if f.Name == "word/document.xml" {
			docFile = f
			break
		}
	}
	if docFile == nil {
		return nil, fmt.Errorf("document.xml not found in DOCX")
	}

	rc, err := docFile.Open()
	if err != nil {
		return nil, fmt.Errorf("open document.xml: %w", err)
	}
	defer rc.Close()

	text, err := extractDocxText(rc)
	if err != nil {
		return nil, fmt.Errorf("extract text: %w", err)
	}

	return &ParseResult{
		Text: text,
	}, nil
}

func extractDocxText(r io.Reader) (string, error) {
	decoder := xml.NewDecoder(r)
	var paragraphs []string
	var currentPara strings.Builder
	inParagraph := false

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}

		switch t := token.(type) {
		case xml.StartElement:
			// <w:p> = paragraph
			if t.Name.Local == "p" {
				inParagraph = true
				currentPara.Reset()
			}
			// <w:t> = text run
			if t.Name.Local == "t" && inParagraph {
				var content string
				for {
					tok, err := decoder.Token()
					if err != nil {
						break
					}
					if char, ok := tok.(xml.CharData); ok {
						content += string(char)
					}
					if _, ok := tok.(xml.EndElement); ok {
						break
					}
				}
				currentPara.WriteString(content)
			}
		case xml.EndElement:
			if t.Name.Local == "p" && inParagraph {
				inParagraph = false
				text := strings.TrimSpace(currentPara.String())
				if text != "" {
					paragraphs = append(paragraphs, text)
				}
			}
		}
	}

	return strings.Join(paragraphs, "\n"), nil
}
