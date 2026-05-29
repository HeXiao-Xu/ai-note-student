package service

import "context"

// LLMProvider defines the interface for LLM implementations
type LLMProvider interface {
	// Chat sends a prompt and returns the text response
	Chat(ctx context.Context, prompt string) (string, error)
	// ChatWithSystem sends a prompt with system instruction
	ChatWithSystem(ctx context.Context, systemPrompt string, userPrompt string) (string, error)
}

// extractJSON extracts JSON content from LLM response that may contain
// markdown code blocks or extra text
func extractJSON(raw string) string {
	// Try to extract ```json ... ``` code block
	start := -1
	end := -1

	// Look for ```json or ``` block
	for i := 0; i < len(raw); i++ {
		if i+6 < len(raw) && raw[i:i+6] == "```json" {
			start = i + 7
			// skip whitespace after ```json
			for start < len(raw) && (raw[start] == '\n' || raw[start] == '\r' || raw[start] == ' ') {
				start++
			}
			break
		}
		if i+3 < len(raw) && raw[i:i+3] == "```" && (i+3 >= len(raw) || raw[i+3] != 'j') {
			// plain ``` block without language tag
			// check if there's a preceding newline or start of string
			if i == 0 || raw[i-1] == '\n' {
				start = i + 3
				for start < len(raw) && (raw[start] == '\n' || raw[start] == '\r' || raw[start] == ' ') {
					start++
				}
				break
			}
		}
	}

	if start >= 0 {
		// Find closing ```
		for i := len(raw) - 1; i >= start; i-- {
			if i+3 <= len(raw) && raw[i:i+3] == "```" {
				end = i
				// trim trailing whitespace
				for end > start && (raw[end-1] == '\n' || raw[end-1] == '\r' || raw[end-1] == ' ') {
					end--
				}
				break
			}
		}
		if end > start {
			return raw[start:end]
		}
	}

	// No code block found, try to find JSON array or object
	trimmed := raw
	// Find first [ or {
	for i := 0; i < len(trimmed); i++ {
		if trimmed[i] == '[' || trimmed[i] == '{' {
			// Find matching closing bracket
			open := trimmed[i]
			close := byte(']')
			if open == '{' {
				close = '}'
			}
			depth := 0
			inStr := false
			escape := false
			for j := i; j < len(trimmed); j++ {
				if escape {
					escape = false
					continue
				}
				if trimmed[j] == '\\' {
					escape = true
					continue
				}
				if trimmed[j] == '"' {
					inStr = !inStr
					continue
				}
				if inStr {
					continue
				}
				if trimmed[j] == open {
					depth++
				} else if trimmed[j] == close {
					depth--
					if depth == 0 {
						return trimmed[i : j+1]
					}
				}
			}
			break
		}
	}

	return raw
}
