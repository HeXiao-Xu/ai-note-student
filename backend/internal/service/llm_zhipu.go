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

// ZhipuLLM implements LLMProvider using Zhipu GLM API
type ZhipuLLM struct {
	apiKey string
	model  string
	client *http.Client
}

func NewZhipuLLM(cfg config.ZhipuConfig) *ZhipuLLM {
	model := cfg.Model
	if model == "" {
		model = "glm-4-flash"
	}
	return &ZhipuLLM{
		apiKey: cfg.APIKey,
		model:  model,
		client: &http.Client{Timeout: 120 * time.Second},
	}
}

// chatRequest / chatResponse follow OpenAI-compatible format
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (z *ZhipuLLM) Chat(ctx context.Context, prompt string) (string, error) {
	return z.ChatWithSystem(ctx, "", prompt)
}

func (z *ZhipuLLM) ChatWithSystem(ctx context.Context, systemPrompt string, userPrompt string) (string, error) {
	messages := []chatMessage{}
	if systemPrompt != "" {
		messages = append(messages, chatMessage{Role: "system", Content: systemPrompt})
	}
	messages = append(messages, chatMessage{Role: "user", Content: userPrompt})

	reqBody := chatRequest{
		Model:    z.model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://open.bigmodel.cn/api/paas/v4/chat/completions", bytes.NewReader(jsonData))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+z.apiKey)

	resp, err := z.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("LLM API error (status %d): %s", resp.StatusCode, string(body))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("LLM API error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("LLM returned no choices")
	}

	return chatResp.Choices[0].Message.Content, nil
}
