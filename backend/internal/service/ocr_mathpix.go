package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ai-note-student/backend/internal/config"
)

type MathpixOCR struct {
	appID  string
	appKey string
	client *http.Client
}

func NewMathpixOCR(cfg config.MathpixConfig) *MathpixOCR {
	return &MathpixOCR{
		appID:  cfg.AppID,
		appKey: cfg.AppKey,
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

func (m *MathpixOCR) Recognize(ctx context.Context, imageData []byte, ext string) (*OCRResult, error) {
	if m.appID == "" || m.appKey == "" {
		return nil, errors.New("mathpix credentials not configured")
	}

	// Send image to Mathpix API
	payload := map[string]interface{}{
		"src":     fmt.Sprintf("data:image/%s;base64,", extToMime(ext)) + base64.StdEncoding.EncodeToString(imageData),
		"formats": []string{"text", "data"},
		"data_options": map[string]interface{}{
			"include_latex":       true,
			"include_ascii":       true,
			"include_mathml":      false,
			"include_tsv":         false,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.mathpix.com/v3/text", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("app_id", m.appID)
	req.Header.Set("app_key", m.appKey)

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call mathpix API: %w", err)
	}
	defer resp.Body.Close()

	var mathpixResp struct {
		Text       string `json:"text"`
		Confidence float64 `json:"confidence"`
		Error      string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&mathpixResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	if mathpixResp.Error != "" {
		return nil, fmt.Errorf("mathpix error: %s", mathpixResp.Error)
	}

	return &OCRResult{
		Text:   mathpixResp.Text,
		LaTeX:  mathpixResp.Text,
	}, nil
}

func extToMime(ext string) string {
	switch ext {
	case ".png":
		return "png"
	case ".jpg", ".jpeg":
		return "jpeg"
	default:
		return "jpeg"
	}
}
