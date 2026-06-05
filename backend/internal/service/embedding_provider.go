package service

import "context"

// EmbeddingProvider defines the interface for text embedding implementations
type EmbeddingProvider interface {
	// Embed generates embeddings for multiple texts
	Embed(ctx context.Context, texts []string) ([][]float32, error)
	// EmbeddingDimension returns the dimension of the embedding vectors
	EmbeddingDimension() int
}
