package services

import (
	"sync"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm/schema"
)

// TestModelTableNames ensures all GORM models map to the exact PostgreSQL table names defined in migrations
func TestModelTableNames(t *testing.T) {
	tests := []struct {
		modelName     string
		actualTable   string
		expectedTable string
	}{
		{"User", models.User{}.TableName(), "users"},
		{"Student", models.Student{}.TableName(), "students"},
		{"Teacher", models.Teacher{}.TableName(), "teachers"},
		{"Subject", models.Subject{}.TableName(), "subjects"},
		{"Class", models.Class{}.TableName(), "classes"},
		{"TeacherSubjectClass", models.TeacherSubjectClass{}.TableName(), "teacher_subject_classes"},
		{"AttendanceSession", models.AttendanceSession{}.TableName(), "attendance_sessions"},
		{"Attendance", models.Attendance{}.TableName(), "attendance"}, // Crucial fix: must be "attendance", not "attendances"
	}

	for _, tt := range tests {
		t.Run(tt.modelName, func(t *testing.T) {
			if tt.actualTable != tt.expectedTable {
				t.Errorf("model %s TableName() = %q, expected %q", tt.modelName, tt.actualTable, tt.expectedTable)
			}
		})
	}
}

// TestGORMSchemaResolution verifies that GORM's schema parser resolves Attendance to "attendance" table
func TestGORMSchemaResolution(t *testing.T) {
	cache := &sync.Map{}
	namer := schema.NamingStrategy{}

	s, err := schema.Parse(&models.Attendance{}, cache, namer)
	if err != nil {
		t.Fatalf("failed to parse Attendance schema with GORM: %v", err)
	}

	if s.Table != "attendance" {
		t.Fatalf("GORM resolved table name to %q, expected authoritative migration table name 'attendance'", s.Table)
	}

	sessionSchema, err := schema.Parse(&models.AttendanceSession{}, cache, namer)
	if err != nil {
		t.Fatalf("failed to parse AttendanceSession schema: %v", err)
	}
	if sessionSchema.Table != "attendance_sessions" {
		t.Fatalf("GORM resolved session table name to %q, expected 'attendance_sessions'", sessionSchema.Table)
	}
}

// TestGenerateSecureToken validates cryptographic entropy, format, and uniqueness
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
		t.Fatalf("expected no error generating second token, got: %v", err)
	}

	if token1 == token2 {
		t.Fatalf("expected unique cryptographically random tokens, got identical tokens: %s", token1)
	}
}

// TestPasswordHashingAndVerification verifies bcrypt password hashing and constant-time check
func TestPasswordHashingAndVerification(t *testing.T) {
	password := "SecretDemoPassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("expected successful password hash, got error: %v", err)
	}
	if hash == password || len(hash) < 20 {
		t.Fatalf("expected secure bcrypt hash, got invalid output: %s", hash)
	}

	if !CheckPassword(hash, password) {
		t.Fatalf("expected CheckPassword to return true for matching password")
	}

	if CheckPassword(hash, "WrongPassword456") {
		t.Fatalf("expected CheckPassword to return false for incorrect password")
	}
}

// TestJWTGenerationAndValidation verifies JWT token issuance, claims payload, and signature check
func TestJWTGenerationAndValidation(t *testing.T) {
	secret := "test-secret-key-1234567890"
	testUser := &models.User{
		ID:       "550e8400-e29b-41d4-a716-446655440000",
		Name:     "Test Faculty",
		Email:    "faculty@test.com",
		Role:     models.RoleTeacher,
		IsActive: true,
	}

	tokenStr, err := GenerateJWT(testUser, secret, 2)
	if err != nil {
		t.Fatalf("expected successful JWT generation, got error: %v", err)
	}
	if tokenStr == "" {
		t.Fatalf("expected non-empty JWT string")
	}

	claims, err := ValidateJWT(tokenStr, secret)
	if err != nil {
		t.Fatalf("expected valid JWT parsing, got error: %v", err)
	}

	if claims.UserID != testUser.ID {
		t.Errorf("expected UserID %s, got %s", testUser.ID, claims.UserID)
	}
	if claims.Email != testUser.Email {
		t.Errorf("expected Email %s, got %s", testUser.Email, claims.Email)
	}
	if claims.Role != testUser.Role {
		t.Errorf("expected Role %s, got %s", testUser.Role, claims.Role)
	}
	if claims.ExpiresAt.Time.Before(time.Now()) {
		t.Errorf("expected future expiration time")
	}

	// Verify invalid secret rejects token
	_, err = ValidateJWT(tokenStr, "wrong-secret-key")
	if err == nil {
		t.Errorf("expected validation to fail with wrong secret key")
	}
}
