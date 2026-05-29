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

type PPTXParser struct{}

func NewPPTXParser() *PPTXParser {
	return &PPTXParser{}
}

func (p *PPTXParser) Parse(ctx context.Context, data []byte) (*ParseResult, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open PPTX: %w", err)
	}

	var slides []string
	for _, f := range reader.File {
		// Match slide files: ppt/slides/slide{N}.xml
		if !strings.HasPrefix(f.Name, "ppt/slides/slide") || !strings.HasSuffix(f.Name, ".xml") {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			continue
		}

		text, err := extractTextFromXML(rc)
		rc.Close()
		if err != nil {
			continue
		}

		if strings.TrimSpace(text) != "" {
			slides = append(slides, text)
		}
	}

	var fullText string
	for i, s := range slides {
		if i > 0 {
			fullText += "\n\n--- Slide " + fmt.Sprintf("%d", i+1) + " ---\n\n"
		} else {
			fullText += "--- Slide 1 ---\n\n"
		}
		fullText += s
	}

	return &ParseResult{
		Text:      fullText,
		Pages:     slides,
		PageCount: len(slides),
	}, nil
}

type xmlNode struct {
	XMLName xml.Name  `xml:""`
	Attrs   []xml.Attr `xml:",any,attr"`
	Content string    `xml:",chardata"`
	Children []xmlNode `xml:",any"`
}

func extractTextFromXML(r io.Reader) (string, error) {
	decoder := xml.NewDecoder(r)
	var texts []string

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}

		start, ok := token.(xml.StartElement)
		if !ok {
			continue
		}

		// In OOXML, text is in <a:t> elements
		if start.Name.Local == "t" {
			var content string
			for {
				t, err := decoder.Token()
				if err != nil {
					break
				}
				if char, ok := t.(xml.CharData); ok {
					content += string(char)
				}
				if _, ok := t.(xml.EndElement); ok {
					break
				}
			}
			if strings.TrimSpace(content) != "" {
				texts = append(texts, content)
			}
		}
	}

	return strings.Join(texts, "\n"), nil
}
