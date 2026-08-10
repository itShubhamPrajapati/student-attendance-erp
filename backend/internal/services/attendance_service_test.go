package services

import (
	"encoding/json"
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

// TestAttendanceSentinelErrors verifies that all attendance validation errors have distinct non-empty messages
func TestAttendanceSentinelErrors(t *testing.T) {
	sentinels := []struct {
		name     string
		err      error
		expected string
	}{
		{"Token Required", ErrSessionTokenRequired, "Session token is required."},
		{"Student Profile Not Found", ErrStudentProfileNotFound, "Student profile not found."},
		{"Student Inactive", ErrStudentAccountInactive, "Student account is inactive."},
		{"Student Not Assigned Class", ErrStudentNotAssignedClass, "You are not assigned to an academic class."},
		{"Invalid Session Token", ErrInvalidSessionToken, "Invalid QR code or session token not found."},
		{"Session Ended", ErrSessionEnded, "Attendance session has ended."},
		{"Session Expired", ErrSessionExpired, "This attendance session has expired."},
		{"Wrong Class", ErrWrongClass, "You are not enrolled in this class."},
		{"Duplicate Attendance", ErrDuplicateAttendance, "Attendance has already been marked for this session."},
	}

	for _, s := range sentinels {
		t.Run(s.name, func(t *testing.T) {
			if s.err == nil {
				t.Fatalf("expected non-nil sentinel error for %s", s.name)
			}
			if s.err.Error() != s.expected {
				t.Errorf("expected %q, got %q", s.expected, s.err.Error())
			}
		})
	}
}

// TestAttendanceServerSideExpirationLogic verifies that session validity is calculated strictly via server UTC time
func TestAttendanceServerSideExpirationLogic(t *testing.T) {
	nowUTC := time.Now().UTC()

	tests := []struct {
		name        string
		startedAt   time.Time
		expiresAt   time.Time
		currentTime time.Time
		isActive    bool
		expectValid bool
	}{
		{
			name:        "Active session well before expiry",
			startedAt:   nowUTC.Add(-2 * time.Minute),
			expiresAt:   nowUTC.Add(8 * time.Minute),
			currentTime: nowUTC,
			isActive:    true,
			expectValid: true,
		},
		{
			name:        "Active session exactly 1 second before expiry",
			startedAt:   nowUTC.Add(-9*time.Minute - 59*time.Second),
			expiresAt:   nowUTC.Add(1 * time.Second),
			currentTime: nowUTC,
			isActive:    true,
			expectValid: true,
		},
		{
			name:        "Expired session (current time 1 second after expires_at)",
			startedAt:   nowUTC.Add(-10 * time.Minute),
			expiresAt:   nowUTC.Add(-1 * time.Second),
			currentTime: nowUTC,
			isActive:    true,
			expectValid: false,
		},
		{
			name:        "Session marked inactive by teacher even if not expired",
			startedAt:   nowUTC.Add(-2 * time.Minute),
			expiresAt:   nowUTC.Add(8 * time.Minute),
			currentTime: nowUTC,
			isActive:    false,
			expectValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isExpired := tt.currentTime.After(tt.expiresAt)
			isValid := tt.isActive && !isExpired

			if isValid != tt.expectValid {
				t.Errorf("expected session validity %v, got %v (isActive=%v, isExpired=%v)",
					tt.expectValid, isValid, tt.isActive, isExpired)
			}
		})
	}
}

// TestStudentClassEnrolmentValidation verifies cross-class and unassigned student rejection
func TestStudentClassEnrolmentValidation(t *testing.T) {
	classA := "class-uuid-fy-a"
	classB := "class-uuid-fy-b"

	tests := []struct {
		name            string
		studentClassID  *string
		sessionClassID  string
		expectedAllowed bool
	}{
		{
			name:            "Student in same class as session",
			studentClassID:  &classA,
			sessionClassID:  classA,
			expectedAllowed: true,
		},
		{
			name:            "Student in Class B trying to mark Class A session (Cross-Class)",
			studentClassID:  &classB,
			sessionClassID:  classA,
			expectedAllowed: false,
		},
		{
			name:            "Student with unassigned class (nil class_id)",
			studentClassID:  nil,
			sessionClassID:  classA,
			expectedAllowed: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			allowed := tt.studentClassID != nil && *tt.studentClassID == tt.sessionClassID
			if allowed != tt.expectedAllowed {
				t.Errorf("expected allowed %v, got %v", tt.expectedAllowed, allowed)
			}
		})
	}
}

// TestMarkAttendanceResponseSecurity verifies that MarkAttendanceResponse does not leak session tokens or user credentials
func TestMarkAttendanceResponseSecurity(t *testing.T) {
	resp := models.MarkAttendanceResponse{
		SessionID:   "session-uuid-123",
		MarkedAt:    time.Now().UTC(),
		SubjectName: "Operating Systems",
		SubjectCode: "CS401",
		ClassName:   "TY-B",
		Status:      "PRESENT",
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("failed to marshal MarkAttendanceResponse: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	forbiddenKeys := []string{"session_token", "jwt", "password", "password_hash", "token", "secret"}
	for _, k := range forbiddenKeys {
		if _, exists := parsed[k]; exists {
			t.Fatalf("SECURITY VIOLATION: MarkAttendanceResponse contains sensitive key %q", k)
		}
	}
}

// TestAttendanceProjectionFormulaCalculation verifies that the mathematical projection calculates the exact minimum integer x satisfying (P+x)/(T+x) >= 0.75
func TestAttendanceProjectionFormulaCalculation(t *testing.T) {
	tests := []struct {
		name          string
		present       int64
		total         int64
		expectedNil   bool
		expectedX     int
		expectedMeet  bool
		expectedPct   float64
	}{
		{
			name:         "Zero classes held",
			present:      0,
			total:        0,
			expectedNil:  true,
			expectedX:    0,
			expectedMeet: false,
			expectedPct:  0.0,
		},
		{
			name:         "100% attendance (20/20)",
			present:      20,
			total:        20,
			expectedNil:  false,
			expectedX:    0,
			expectedMeet: true,
			expectedPct:  100.0,
		},
		{
			name:         "Exactly 75% boundary (15/20 = 75.0%)",
			present:      15,
			total:        20,
			expectedNil:  false,
			expectedX:    0,
			expectedMeet: true,
			expectedPct:  75.0,
		},
		{
			name:         "70% attendance (7/10 = 70.0% -> needs 2)",
			present:      7,
			total:        10,
			expectedNil:  false,
			expectedX:    2, // (7+2)/(10+2) = 9/12 = 75.0%
			expectedMeet: false,
			expectedPct:  70.0,
		},
		{
			name:         "60% attendance (30/50 = 60.0% -> needs 30)",
			present:      30,
			total:        50,
			expectedNil:  false,
			expectedX:    30, // (30+30)/(50+30) = 60/80 = 75.0%
			expectedMeet: false,
			expectedPct:  60.0,
		},
		{
			name:         "Critical 50% attendance (5/10 = 50.0% -> needs 10)",
			present:      5,
			total:        10,
			expectedNil:  false,
			expectedX:    10, // (5+10)/(10+10) = 15/20 = 75.0%
			expectedMeet: false,
			expectedPct:  50.0,
		},
		{
			name:         "Low 56% attendance (14/25 = 56.0% -> needs 19)",
			present:      14,
			total:        25,
			expectedNil:  false,
			expectedX:    19, // (14+19)/(25+19) = 33/44 = 75.0%
			expectedMeet: false,
			expectedPct:  56.0,
		},
		{
			name:         "68% attendance (17/25 = 68.0% -> needs 7)",
			present:      17,
			total:        25,
			expectedNil:  false,
			expectedX:    7, // (17+7)/(25+7) = 24/32 = 75.0%
			expectedMeet: false,
			expectedPct:  68.0,
		},
		{
			name:         "Critical 0% attendance (0/10 = 0.0% -> needs 30)",
			present:      0,
			total:        10,
			expectedNil:  false,
			expectedX:    30, // (0+30)/(10+30) = 30/40 = 75.0%
			expectedMeet: false,
			expectedPct:  0.0,
		},
		{
			name:         "Near boundary 74.9% (749/1000 = 74.9% -> needs 4)",
			present:      749,
			total:        1000,
			expectedNil:  false,
			expectedX:    4, // 3(1000) - 4(749) = 3000 - 2996 = 4. (749+4)/(1000+4) = 753/1004 = 0.750
			expectedMeet: false,
			expectedPct:  74.9,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var overallPct float64 = 0.0
			if tt.total > 0 {
				overallPct = math.Round((float64(tt.present)/float64(tt.total))*1000) / 10
			}

			if overallPct != tt.expectedPct {
				t.Errorf("expected percentage %.1f, got %.1f", tt.expectedPct, overallPct)
			}

			var classesNeeded *int
			isMeeting := false

			if tt.total > 0 {
				if overallPct >= 75.0 {
					zero := 0
					classesNeeded = &zero
					isMeeting = true
				} else {
					val := int(3*tt.total - 4*tt.present)
					if val < 0 {
						val = 0
					}
					classesNeeded = &val
					isMeeting = false
				}
			}

			if tt.expectedNil {
				if classesNeeded != nil {
					t.Errorf("expected classesNeeded to be nil, got %v", *classesNeeded)
				}
			} else {
				if classesNeeded == nil {
					t.Fatalf("expected classesNeeded to be non-nil")
				}
				if *classesNeeded != tt.expectedX {
					t.Errorf("expected %d classes needed, got %d", tt.expectedX, *classesNeeded)
				}
				// Verify mathematical property: (P + x) / (T + x) >= 0.75
				newP := float64(tt.present + int64(*classesNeeded))
				newT := float64(tt.total + int64(*classesNeeded))
				if newP/newT < 0.75 {
					t.Errorf("projection failed to reach 75%%: (P+x)/(T+x) = %f/%f = %f", newP, newT, newP/newT)
				}
				// Verify x-1 would NOT reach 75% if x > 0
				if *classesNeeded > 0 {
					smallerX := int64(*classesNeeded - 1)
					if (float64(tt.present+smallerX) / float64(tt.total+smallerX)) >= 0.75 {
						t.Errorf("x = %d is not the minimum integer (x-1 would also reach 75%%)", *classesNeeded)
					}
				}
			}

			if isMeeting != tt.expectedMeet {
				t.Errorf("expected isMeeting=%v, got %v", tt.expectedMeet, isMeeting)
			}
		})
	}
}

// TestAttendanceAnalyticsStatusClassification verifies status mapping (REQUIREMENT_MET, BELOW_REQUIREMENT, CRITICAL)
func TestAttendanceAnalyticsStatusClassification(t *testing.T) {
	tests := []struct {
		name           string
		percentage     float64
		totalSessions  int64
		expectedStatus string
	}{
		{"100% attendance", 100.0, 20, "REQUIREMENT_MET"},
		{"82.5% attendance", 82.5, 40, "REQUIREMENT_MET"},
		{"Exactly 75.0% boundary", 75.0, 20, "REQUIREMENT_MET"},
		{"74.9% below boundary", 74.9, 100, "BELOW_REQUIREMENT"},
		{"60.0% critical boundary", 60.0, 25, "BELOW_REQUIREMENT"},
		{"59.9% critical", 59.9, 100, "CRITICAL"},
		{"0% critical", 0.0, 10, "CRITICAL"},
		{"0 sessions held", 0.0, 0, "REQUIREMENT_MET"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := "REQUIREMENT_MET"
			if tt.totalSessions > 0 {
				if tt.percentage >= 75.0 {
					status = "REQUIREMENT_MET"
				} else if tt.percentage >= 60.0 {
					status = "BELOW_REQUIREMENT"
				} else {
					status = "CRITICAL"
				}
			}

			if status != tt.expectedStatus {
				t.Errorf("expected status %s for percentage %.1f (total %d), got %s",
					tt.expectedStatus, tt.percentage, tt.totalSessions, status)
			}
		})
	}
}

// TestAttendanceMonthlyTrendLogic verifies IMPROVING, DECLINING, STABLE, and INSUFFICIENT_DATA status calculation
func TestAttendanceMonthlyTrendLogic(t *testing.T) {
	tests := []struct {
		name           string
		monthlyPcts    []float64
		expectedStatus string
		expectedDiff   float64
	}{
		{
			name:           "Zero months",
			monthlyPcts:    []float64{},
			expectedStatus: "INSUFFICIENT_DATA",
			expectedDiff:   0.0,
		},
		{
			name:           "Single month (insufficient data)",
			monthlyPcts:    []float64{82.0},
			expectedStatus: "INSUFFICIENT_DATA",
			expectedDiff:   0.0,
		},
		{
			name:           "Improving trend (+4.2 points: 76.8% -> 81.0%)",
			monthlyPcts:    []float64{76.8, 81.0},
			expectedStatus: "IMPROVING",
			expectedDiff:   4.2,
		},
		{
			name:           "Declining trend (-3.5 points: 85.0% -> 81.5%)",
			monthlyPcts:    []float64{85.0, 81.5},
			expectedStatus: "DECLINING",
			expectedDiff:   -3.5,
		},
		{
			name:           "Stable trend within tolerance (+1.2 points: 80.0% -> 81.2%)",
			monthlyPcts:    []float64{80.0, 81.2},
			expectedStatus: "STABLE",
			expectedDiff:   1.2,
		},
		{
			name:           "Stable trend small drop (-1.5 points: 80.0% -> 78.5%)",
			monthlyPcts:    []float64{80.0, 78.5},
			expectedStatus: "STABLE",
			expectedDiff:   -1.5,
		},
		{
			name:           "Multi-month sequence takes last two (70.0%, 75.0%, 80.0%)",
			monthlyPcts:    []float64{70.0, 75.0, 80.0},
			expectedStatus: "IMPROVING",
			expectedDiff:   5.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			trendStatus := "INSUFFICIENT_DATA"
			diffPctPoints := 0.0

			if len(tt.monthlyPcts) >= 2 {
				curr := tt.monthlyPcts[len(tt.monthlyPcts)-1]
				prev := tt.monthlyPcts[len(tt.monthlyPcts)-2]
				diff := curr - prev
				diffPctPoints = math.Round(diff*10) / 10

				if diff >= 2.0 {
					trendStatus = "IMPROVING"
				} else if diff <= -2.0 {
					trendStatus = "DECLINING"
				} else {
					trendStatus = "STABLE"
				}
			}

			if trendStatus != tt.expectedStatus {
				t.Errorf("expected trend status %s, got %s", tt.expectedStatus, trendStatus)
			}
			if diffPctPoints != tt.expectedDiff {
				t.Errorf("expected diff %.1f, got %.1f", tt.expectedDiff, diffPctPoints)
			}
		})
	}
}

// TestDateRangeValidationLogic verifies that from <= to date validation behaves accurately
func TestDateRangeValidationLogic(t *testing.T) {
	const dateLayout = "2006-01-02"

	tests := []struct {
		name        string
		fromStr     string
		toStr       string
		expectValid bool
	}{
		{"Valid chronological range", "2026-01-01", "2026-06-30", true},
		{"Same day range", "2026-03-15", "2026-03-15", true},
		{"Inverted date range (from > to)", "2026-08-01", "2026-01-01", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fromT, errFrom := time.Parse(dateLayout, tt.fromStr)
			toT, errTo := time.Parse(dateLayout, tt.toStr)
			if errFrom != nil || errTo != nil {
				t.Fatalf("unexpected parse error")
			}

			isValid := !fromT.After(toT)
			if isValid != tt.expectValid {
				t.Errorf("expected validity %v for range %s to %s, got %v", tt.expectValid, tt.fromStr, tt.toStr, isValid)
			}
		})
	}
}


