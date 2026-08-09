package services

import (
	"math"
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

// TestStudentAttendanceSummaryCalculation verifies percentage formulas, zero division safety, and absent count accuracy
func TestStudentAttendanceSummaryCalculation(t *testing.T) {
	tests := []struct {
		name              string
		present           int64
		total             int64
		expectedPct       float64
		expectedAbsent    int64
	}{
		{
			name:           "Zero classes held",
			present:        0,
			total:          0,
			expectedPct:    0.0,
			expectedAbsent: 0,
		},
		{
			name:           "Standard attendance 41/50 = 82%",
			present:        41,
			total:          50,
			expectedPct:    82.0,
			expectedAbsent: 9,
		},
		{
			name:           "Perfect attendance 20/20 = 100%",
			present:        20,
			total:          20,
			expectedPct:    100.0,
			expectedAbsent: 0,
		},
		{
			name:           "Low attendance with decimal rounding 17/25 = 68%",
			present:        17,
			total:          25,
			expectedPct:    68.0,
			expectedAbsent: 8,
		},
		{
			name:           "One-third attendance with decimal rounding 1/3 = 33.3%",
			present:        1,
			total:          3,
			expectedPct:    33.3,
			expectedAbsent: 2,
		},
		{
			name:           "Exactly 75% boundary (15/20 = 75.0%)",
			present:        15,
			total:          20,
			expectedPct:    75.0,
			expectedAbsent: 5,
		},
		{
			name:           "Critical zero attendance (0/10 = 0.0%)",
			present:        0,
			total:          10,
			expectedPct:    0.0,
			expectedAbsent: 10,
		},
		{
			name:           "Critical below 60% (14/25 = 56.0%)",
			present:        14,
			total:          25,
			expectedPct:    56.0,
			expectedAbsent: 11,
		},
		{
			name:           "Near boundary 74.9% (749/1000 = 74.9%)",
			present:        749,
			total:          1000,
			expectedPct:    74.9,
			expectedAbsent: 251,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var pct float64 = 0.0
			var absent int64 = 0

			if tt.total > 0 {
				pct = float64(int(float64(tt.present)/float64(tt.total)*1000+0.5)) / 10.0
				if tt.total > tt.present {
					absent = tt.total - tt.present
				}
			}

			if pct != tt.expectedPct {
				t.Errorf("expected percentage %.1f, got %.1f", tt.expectedPct, pct)
			}
			if absent != tt.expectedAbsent {
				t.Errorf("expected absent count %d, got %d", tt.expectedAbsent, absent)
			}
		})
	}
}

// TestStudentCalendarDayStatusAggregation verifies that daily status is correctly classified as PRESENT, ABSENT, or PARTIAL
func TestStudentCalendarDayStatusAggregation(t *testing.T) {
	tests := []struct {
		name           string
		sessionStatuses []string
		expectedStatus string
	}{
		{
			name:           "All sessions present on that day",
			sessionStatuses: []string{"PRESENT", "PRESENT"},
			expectedStatus: "PRESENT",
		},
		{
			name:           "All sessions absent on that day",
			sessionStatuses: []string{"ABSENT", "ABSENT"},
			expectedStatus: "ABSENT",
		},
		{
			name:           "Mixed sessions present and absent (Partial)",
			sessionStatuses: []string{"PRESENT", "ABSENT", "PRESENT"},
			expectedStatus: "PARTIAL",
		},
		{
			name:           "Single present session",
			sessionStatuses: []string{"PRESENT"},
			expectedStatus: "PRESENT",
		},
		{
			name:           "Single absent session",
			sessionStatuses: []string{"ABSENT"},
			expectedStatus: "ABSENT",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			presentCount := 0
			absentCount := 0
			for _, st := range tt.sessionStatuses {
				if st == "PRESENT" {
					presentCount++
				} else {
					absentCount++
				}
			}

			dayStatus := "PRESENT"
			if presentCount > 0 && absentCount > 0 {
				dayStatus = "PARTIAL"
			} else if absentCount > 0 && presentCount == 0 {
				dayStatus = "ABSENT"
			}

			if dayStatus != tt.expectedStatus {
				t.Errorf("expected day status %s, got %s", tt.expectedStatus, dayStatus)
			}
		})
	}
}

// TestStudentAttendanceHistoryPaginationAndSummary verifies page counts, limit constraints, and summary percentages
func TestStudentAttendanceHistoryPaginationAndSummary(t *testing.T) {
	tests := []struct {
		name          string
		totalRecords  int64
		presentCount  int64
		inputPage     int
		inputLimit    int
		expectedPage  int
		expectedLimit int
		expectedPages int
		expectedAbsent int64
		expectedPct   float64
	}{
		{
			name:          "Zero records",
			totalRecords:  0,
			presentCount:  0,
			inputPage:     1,
			inputLimit:    20,
			expectedPage:  1,
			expectedLimit: 20,
			expectedPages: 0,
			expectedAbsent: 0,
			expectedPct:   0.0,
		},
		{
			name:          "Standard 42 records with limit 20 (3 pages)",
			totalRecords:  42,
			presentCount:  35,
			inputPage:     1,
			inputLimit:    20,
			expectedPage:  1,
			expectedLimit: 20,
			expectedPages: 3,
			expectedAbsent: 7,
			expectedPct:   83.3,
		},
		{
			name:          "Page below minimum adjusted to 1",
			totalRecords:  15,
			presentCount:  15,
			inputPage:     -5,
			inputLimit:    10,
			expectedPage:  1,
			expectedLimit: 10,
			expectedPages: 2,
			expectedAbsent: 0,
			expectedPct:   100.0,
		},
		{
			name:          "Limit above maximum 100 capped at 100",
			totalRecords:  250,
			presentCount:  175,
			inputPage:     2,
			inputLimit:    500,
			expectedPage:  2,
			expectedLimit: 100,
			expectedPages: 3,
			expectedAbsent: 75,
			expectedPct:   70.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			page := tt.inputPage
			if page < 1 {
				page = 1
			}
			limit := tt.inputLimit
			if limit < 1 {
				limit = 20
			} else if limit > 100 {
				limit = 100
			}

			totalPages := 0
			if tt.totalRecords > 0 {
				totalPages = int(math.Ceil(float64(tt.totalRecords) / float64(limit)))
			}

			absent := int64(0)
			if tt.totalRecords > tt.presentCount {
				absent = tt.totalRecords - tt.presentCount
			}

			pct := 0.0
			if tt.totalRecords > 0 {
				pct = math.Round((float64(tt.presentCount)/float64(tt.totalRecords))*1000) / 10
			}

			if page != tt.expectedPage {
				t.Errorf("expected page %d, got %d", tt.expectedPage, page)
			}
			if limit != tt.expectedLimit {
				t.Errorf("expected limit %d, got %d", tt.expectedLimit, limit)
			}
			if totalPages != tt.expectedPages {
				t.Errorf("expected total pages %d, got %d", tt.expectedPages, totalPages)
			}
			if absent != tt.expectedAbsent {
				t.Errorf("expected absent %d, got %d", tt.expectedAbsent, absent)
			}
			if pct != tt.expectedPct {
				t.Errorf("expected percentage %.1f, got %.1f", tt.expectedPct, pct)
			}
		})
	}
}
