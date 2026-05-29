package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/ai-note-student/backend/internal/config"
)

type BaiduOCR struct {
	apiKey    string
	secretKey string
	token     string
	tokenExp  time.Time
	mu        sync.Mutex
	client    *http.Client
}

func NewBaiduOCR(cfg config.BaiduOCRConfig) *BaiduOCR {
	return &BaiduOCR{
		apiKey:    cfg.APIKey,
		secretKey: cfg.SecretKey,
		client:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (b *BaiduOCR) getToken(ctx context.Context) (string, error) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.token != "" && time.Now().Before(b.tokenExp) {
		return b.token, nil
	}

	tokenURL := fmt.Sprintf(
		"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s",
		url.QueryEscape(b.apiKey), url.QueryEscape(b.secretKey),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, nil)
	if err != nil {
		return "", fmt.Errorf("create token request: %w", err)
	}

	resp, err := b.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request token: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode token response: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("baidu token error: %s", result.Error)
	}

	b.token = result.AccessToken
	b.tokenExp = time.Now().Add(time.Duration(result.ExpiresIn-60) * time.Second)
	return b.token, nil
}

func (b *BaiduOCR) Recognize(ctx context.Context, imageData []byte, ext string) (*OCRResult, error) {
	if b.apiKey == "" || b.secretKey == "" {
		return nil, errors.New("baidu OCR API key not configured")
	}

	token, err := b.getToken(ctx)
	if err != nil {
		return nil, err
	}

	// Base64 encode the image
	b64 := base64.StdEncoding.EncodeToString(imageData)

	// Try general basic OCR first
	result, err := b.callOCR(ctx, token, "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic", b64)
	if err != nil {
		return nil, fmt.Errorf("baidu OCR: %w", err)
	}

	return result, nil
}

func (b *BaiduOCR) callOCR(ctx context.Context, token string, apiURL string, imageBase64 string) (*OCRResult, error) {
	formData := url.Values{}
	formData.Set("image", imageBase64)

	fullURL := apiURL + "?access_token=" + token
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Body = io.NopCloser(strings.NewReader(formData.Encode()))

	resp, err := b.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call OCR API: %w", err)
	}
	defer resp.Body.Close()

	var ocrResp struct {
		WordsResult []struct {
			Words string `json:"words"`
		} `json:"words_result"`
		WordsResultNum int    `json:"words_result_num"`
		ErrorCode      int    `json:"error_code"`
		ErrorMsg       string `json:"error_msg"`
		LogID          int64  `json:"log_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ocrResp); err != nil {
		return nil, fmt.Errorf("decode OCR response: %w", err)
	}
	if ocrResp.ErrorCode != 0 {
		return nil, fmt.Errorf("baidu OCR error %d: %s", ocrResp.ErrorCode, ocrResp.ErrorMsg)
	}

	var paragraphs []string
	var fullText string
	for _, w := range ocrResp.WordsResult {
		paragraphs = append(paragraphs, w.Words)
	}
	for i, p := range paragraphs {
		if i > 0 {
			fullText += "\n"
		}
		fullText += p
	}

	return &OCRResult{
		Text:       fullText,
		Paragraphs: paragraphs,
	}, nil
}

