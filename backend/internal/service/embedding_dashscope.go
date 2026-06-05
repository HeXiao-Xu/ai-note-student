package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ai-note-student/backend/internal/config"
)

// DashScopeEmbedding implements EmbeddingProvider using DashScope (通义千问) embedding API
type DashScopeEmbedding struct {
	apiKey string
	model  string
	client *http.Client
}

func NewDashScopeEmbedding(cfg config.DashScopeConfig, embeddingModel string) *DashScopeEmbedding {
	model := embeddingModel
	if model == "" {
		model = "text-embedding-v3"
	}
	return &DashScopeEmbedding{
		apiKey: cfg.APIKey,
		model:  model,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

type dashscopeEmbeddingRequest struct {
	Model string `json:"model"`
	Input struct {
		Texts []string `json:"texts"`
	} `json:"input"`
	Parameters struct {
		Dimension int `json:"dimension,omitempty"`
	} `json:"parameters"`
}

type dashscopeEmbeddingResponse struct {
	Output struct {
		Embeddings []struct {
			Embedding []float32 `json:"embedding"`
			TextIndex int       `json:"text_index"`
		} `json:"embeddings"`
	} `json:"output"`
	Usage struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"usage"`
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
}

func (d *DashScopeEmbedding) Embed(ctx context.Context, texts []string) ([][]float32, error) {
	reqBody := dashscopeEmbeddingRequest{}
	reqBody.Model = d.model
	reqBody.Input.Texts = texts
	reqBody.Parameters.Dimension = 1024

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding", bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+d.apiKey)

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding API error (status %d): %s", resp.StatusCode, string(body))
	}

	var embResp dashscopeEmbeddingResponse
	if err := json.Unmarshal(body, &embResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if embResp.Code != "" && embResp.Code != "Success" {
		return nil, fmt.Errorf("embedding API error: %s - %s", embResp.Code, embResp.Message)
	}

	if len(embResp.Output.Embeddings) == 0 {
		return nil, fmt.Errorf("embedding API returned no data")
	}

	result := make([][]float32, len(texts))
	for _, e := range embResp.Output.Embeddings {
		if e.TextIndex < len(result) {
			result[e.TextIndex] = e.Embedding
		}
	}

	return result, nil
}

func (d *DashScopeEmbedding) EmbeddingDimension() int {
	return 1024
}
