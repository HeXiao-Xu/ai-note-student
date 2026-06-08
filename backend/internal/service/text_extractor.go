package service

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"
)

// TextExtractor extracts text content from documents for RAG
type TextExtractor struct {
	pdftotextPath string
	timeout       time.Duration
}

func NewTextExtractor(pdftotextPath string) *TextExtractor {
	if pdftotextPath == "" {
		pdftotextPath = findPdftotext()
	}
	return &TextExtractor{
		pdftotextPath: pdftotextPath,
		timeout:       30 * time.Second,
	}
}

func findPdftotext() string {
	paths := []string{
		"pdftotext",
		"/usr/bin/pdftotext",
		"C:\\Program Files\\poppler\\pdftotext.exe",
	}

	for _, p := range paths {
		if _, err := exec.LookPath(p); err == nil {
			return p
		}
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// ExtractFromPDF extracts text from PDF using pdftotext
func (te *TextExtractor) ExtractFromPDF(ctx context.Context, pdfFile string) (string, error) {
	if te.pdftotextPath == "" {
		// Fallback: return empty text if pdftotext not available
		return "", fmt.Errorf("pdftotext not found")
	}

	ctx, cancel := context.WithTimeout(ctx, te.timeout)
	defer cancel()

	// pdftotext -layout <pdfFile> -
	cmd := exec.CommandContext(ctx, te.pdftotextPath, "-layout", pdfFile, "-")
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("pdftotext failed: %w", err)
	}

	return cleanText(string(output)), nil
}

// ExtractFromPPTX extracts text from PPTX by parsing XML content
func (te *TextExtractor) ExtractFromPPTX(ctx context.Context, pptxFile string) (string, error) {
	info, err := os.Stat(pptxFile)
	if err != nil {
		return "", fmt.Errorf("stat pptx file: %w", err)
	}
	reader, err := os.Open(pptxFile)
	if err != nil {
		return "", fmt.Errorf("open pptx file: %w", err)
	}
	defer reader.Close()

	return extractFromOfficeXML(reader, info.Size(), "ppt/slides/slide")
}

// ExtractFromDOCX extracts text from DOCX by parsing XML content
func (te *TextExtractor) ExtractFromDOCX(ctx context.Context, docxFile string) (string, error) {
	info, err := os.Stat(docxFile)
	if err != nil {
		return "", fmt.Errorf("stat docx file: %w", err)
	}
	reader, err := os.Open(docxFile)
	if err != nil {
		return "", fmt.Errorf("open docx file: %w", err)
	}
	defer reader.Close()

	return extractFromOfficeXML(reader, info.Size(), "word/document.xml")
}

// extractFromOfficeXML extracts text from Office XML-based formats (PPTX/DOCX)
func extractFromOfficeXML(reader io.ReaderAt, size int64, targetPath string) (string, error) {
	zipReader, err := zip.NewReader(reader, size)
	if err != nil {
		return "", fmt.Errorf("read zip: %w", err)
	}

	var texts []string

	for _, f := range zipReader.File {
		// For PPTX: match slide files like ppt/slides/slide1.xml, slide2.xml...
		// For DOCX: match word/document.xml
		if strings.HasPrefix(f.Name, targetPath) && strings.HasSuffix(f.Name, ".xml") {
			rc, err := f.Open()
			if err != nil {
				continue
			}
			content, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				continue
			}

			// Extract text from <a:t> elements (Office Open XML text elements)
			text := extractTextFromXML(content)
			if text != "" {
				texts = append(texts, text)
			}
		}
	}

	if len(texts) == 0 {
		return "", nil
	}

	return cleanText(strings.Join(texts, "\n")), nil
}

// extractTextFromXML extracts text content from <a:t> or <w:t> XML elements
func extractTextFromXML(content []byte) string {
	var result strings.Builder

	textPatterns := []string{"<a:t>", "<w:t>"}
	for _, pattern := range textPatterns {
		idx := 0
		for {
			start := strings.Index(string(content[idx:]), pattern)
			if start == -1 {
				break
			}
			start += idx + len(pattern)
			end := strings.Index(string(content[start:]), "</")
			if end == -1 {
				break
			}
			end += start
			text := string(content[start:end])
			text = strings.ReplaceAll(text, "&amp;", "&")
			text = strings.ReplaceAll(text, "&lt;", "<")
			text = strings.ReplaceAll(text, "&gt;", ">")
			text = strings.ReplaceAll(text, "&quot;", "\"")
			text = strings.ReplaceAll(text, "&apos;", "'")
			result.WriteString(text)
			result.WriteString(" ")
			idx = end + 4
		}
	}

	return result.String()
}

// cleanText removes excessive whitespace and empty lines
func cleanText(text string) string {
	// Remove excessive whitespace
	lines := strings.Split(text, "\n")
	var cleaned []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			cleaned = append(cleaned, line)
		}
	}
	return strings.Join(cleaned, "\n")
}

// IsAvailable returns true if at least one extraction method is available
func (te *TextExtractor) IsAvailable() bool {
	return te.pdftotextPath != ""
}

// ExtractFromFile extracts text from a file path
func (te *TextExtractor) ExtractFromFile(ctx context.Context, filePath string, ext string) (string, error) {
	switch ext {
	case ".pdf":
		return te.ExtractFromPDF(ctx, filePath)
	case ".pptx":
		return te.ExtractFromPPTX(ctx, filePath)
	case ".docx":
		return te.ExtractFromDOCX(ctx, filePath)
	default:
		return "", fmt.Errorf("unsupported file type: %s", ext)
	}
}