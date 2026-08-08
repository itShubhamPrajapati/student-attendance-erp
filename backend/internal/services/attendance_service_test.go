package services

import (
	"testing"
)

func TestGenerateSecureToken(t *testing.T) {
	token1, err := GenerateSecureToken()
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}
	if len(token1) < 32 {
		t.Fatalf("expected token length >= 32 hex chars, got length %d", len(token1))
	}

	token2, err := GenerateSecureToken()
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}

	if token1 == token2 {
		t.Fatalf("expected unique cryptographically random tokens, got identical tokens: %s", token1)
	}
}
