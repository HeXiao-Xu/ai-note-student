package service

import (
	"context"
	"time"

	"github.com/ai-note-student/backend/internal/config"
)

// DashScopeLLM implements LLMProvider using Aliyun DashScope API
// DashScope compatible mode uses OpenAI-compatible format
type DashScopeLLM struct {
	impl *OpenAILLM
}

func NewDashScopeLLM(cfg config.DashScopeConfig) *DashScopeLLM {
	// DashScope compatible-mode endpoint uses OpenAI format
	openaiCfg := config.OpenAIConfig{
		APIKey:  cfg.APIKey,
		BaseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
		Model:   cfg.Model,
	}
	if openaiCfg.Model == "" {
		openaiCfg.Model = "qwen-plus"
	}
	return &DashScopeLLM{
		impl: NewOpenAILLM(openaiCfg),
	}
}

// Ensure DashScopeLLM implements LLMProvider
var _ LLMProvider = (*DashScopeLLM)(nil)

func init() {
	_ = time.Second // avoid unused import
}

func (d *DashScopeLLM) Chat(ctx context.Context, prompt string) (string, error) {
	return d.impl.Chat(ctx, prompt)
}

func (d *DashScopeLLM) ChatWithSystem(ctx context.Context, systemPrompt string, userPrompt string) (string, error) {
	return d.impl.ChatWithSystem(ctx, systemPrompt, userPrompt)
}
