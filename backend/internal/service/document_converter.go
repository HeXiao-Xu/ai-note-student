package service

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// DocumentConverter converts documents to PDF using LibreOffice
type DocumentConverter struct {
	libreOfficePath string
	timeout         time.Duration
}

func NewDocumentConverter(libreOfficePath string) *DocumentConverter {
	if libreOfficePath == "" {
		// Default paths
		libreOfficePath = findLibreOffice()
	}
	return &DocumentConverter{
		libreOfficePath: libreOfficePath,
		timeout:         60 * time.Second,
	}
}

func findLibreOffice() string {
	// Common paths for LibreOffice
	paths := []string{
		"soffice",
		"libreoffice",
		"/usr/bin/soffice",
		"/usr/bin/libreoffice",
		"C:\\Program Files\\LibreOffice\\program\\soffice.exe",
		"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
	}

	for _, p := range paths {
		if _, err := exec.LookPath(p); err == nil {
			return p
		}
		// Check if file exists directly
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// ConvertToPDF converts a document (PPTX/DOCX) to PDF
// Returns the PDF file path, caller should delete it after use
func (dc *DocumentConverter) ConvertToPDF(ctx context.Context, inputFile string, ext string) (string, error) {
	if dc.libreOfficePath == "" {
		return "", fmt.Errorf("LibreOffice not found, cannot convert %s to PDF", ext)
	}

	// Create temp output directory
	outputDir, err := os.MkdirTemp("", "doc_convert_*")
	if err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}

	// Run LibreOffice conversion
	// soffice --headless --convert-to pdf --outdir <outputDir> <inputFile>
	ctx, cancel := context.WithTimeout(ctx, dc.timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, dc.libreOfficePath,
		"--headless",
		"--convert-to", "pdf",
		"--outdir", outputDir,
		inputFile,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		os.RemoveAll(outputDir)
		return "", fmt.Errorf("libreoffice conversion failed: %w, output: %s", err, string(output))
	}

	// Find the generated PDF
	inputBaseName := strings.TrimSuffix(filepath.Base(inputFile), ext)
	pdfPath := filepath.Join(outputDir, inputBaseName+".pdf")

	if _, err := os.Stat(pdfPath); err != nil {
		os.RemoveAll(outputDir)
		return "", fmt.Errorf("PDF file not found after conversion: %w", err)
	}

	return pdfPath, nil
}

// IsAvailable returns true if LibreOffice is available
func (dc *DocumentConverter) IsAvailable() bool {
	return dc.libreOfficePath != ""
}