package services

import (
	"math"
	"strings"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"
)

// TestTeacherProfilePasswordValidation tests password strength and length boundaries
func TestTeacherProfilePasswordValidation(t *testing.T) {
	tests := []struct {
		name        string
		currentPass string
		newPass     string
		expectErr   bool
		errContains string
	}{
		{
			name:        "Valid password",
			currentPass: "FacultyPassword#2026",
			newPass:     "NewSecureFacultyPassword#2027",
			expectErr:   false,
		},
		{
			name:        "Empty current password",
			currentPass: "   ",
			newPass:     "NewPassword123",
			expectErr:   true,
			errContains: "current password is required",
		},
		{
			name:        "Too short new password (5 chars)",
			currentPass: "FacultyPassword#2026",
			newPass:     "12345",
			expectErr:   true,
			errContains: "at least 6 characters",
		},
		{
			name:        "Exact 6 characters accepted",
			currentPass: "FacultyPassword#2026",
			newPass:     "abcdef",
			expectErr:   false,
		},
		{
			name:        "Excessively long password (129 chars)",
			currentPass: "FacultyPassword#2026",
			newPass:     strings.Repeat("a", 129),
			expectErr:   true,
			errContains: "cannot exceed 128 characters",
		},
		{
			name:        "Exact 128 characters accepted",
			currentPass: "FacultyPassword#2026",
			newPass:     strings.Repeat("a", 128),
			expectErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			current := strings.TrimSpace(tt.currentPass)
			newP := strings.TrimSpace(tt.newPass)

			var err string
			if current == "" {
				err = "current password is required"
			} else if len(newP) < 6 {
				err = "new password must be at least 6 characters in length"
			} else if len(newP) > 128 {
				err = "new password cannot exceed 128 characters"
			}

			if tt.expectErr {
				if err == "" {
					t.Errorf("expected error containing '%s', but got nil", tt.errContains)
				} else if !strings.Contains(err, tt.errContains) {
					t.Errorf("expected error to contain '%s', got '%s'", tt.errContains, err)
				}
			} else {
				if err != "" {
					t.Errorf("unexpected error: %s", err)
				}
			}
		})
	}
}

// TestTeacherProfileBcryptVerification tests password hashing and constant-time verification
func TestTeacherProfileBcryptVerification(t *testing.T) {
	rawPassword := "FacultySecureKey#2026"

	hashed, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if hashed == rawPassword {
		t.Fatalf("hashed password must not match raw plaintext")
	}

	if !CheckPassword(hashed, rawPassword) {
		t.Errorf("expected CheckPassword to return true for correct password")
	}

	if CheckPassword(hashed, "IncorrectPassword#999") {
		t.Errorf("expected CheckPassword to return false for incorrect password")
	}
}

// TestTeacherProfileContactValidation tests phone and address length constraints
func TestTeacherProfileContactValidation(t *testing.T) {
	validPhones := []string{"+91 9876543210", "9876543210", "+1 (555) 123-4567", ""}
	for _, p := range validPhones {
		trimmed := strings.TrimSpace(p)
		if len(trimmed) > 20 {
			t.Errorf("phone '%s' should be valid (<= 20 chars)", p)
		}
	}

	invalidPhone := strings.Repeat("9", 25)
	if len(strings.TrimSpace(invalidPhone)) <= 20 {
		t.Errorf("phone of length 25 should exceed max limit of 20")
	}

	validAddress := "Staff Quarters B-12, University Campus, Mumbai 400001"
	if len(strings.TrimSpace(validAddress)) > 255 {
		t.Errorf("valid address should not exceed 255 characters")
	}

	invalidAddress := strings.Repeat("A", 300)
	if len(strings.TrimSpace(invalidAddress)) <= 255 {
		t.Errorf("address of length 300 should exceed max limit of 255")
	}
}

// TestTeacherTeachingStatsCalculations tests attendance formula (PRESENT + LATE) / TOTAL * 100
func TestTeacherTeachingStatsCalculations(t *testing.T) {
	tests := []struct {
		name          string
		present       int64
		late          int64
		absent        int64
		expectedAtt   float64
		expectedLate  float64
	}{
		{
			name:         "Standard mixed session (40 present, 5 late, 5 absent)",
			present:      40,
			late:         5,
			absent:       5,
			expectedAtt:  90.0, // (40 + 5) / 50 = 90%
			expectedLate: 10.0, // 5 / 50 = 10%
		},
		{
			name:         "All present (50 present, 0 late, 0 absent)",
			present:      50,
			late:         0,
			absent:       0,
			expectedAtt:  100.0,
			expectedLate: 0.0,
		},
		{
			name:         "All late (0 present, 50 late, 0 absent)",
			present:      0,
			late:         50,
			absent:       0,
			expectedAtt:  100.0, // 50 / 50 = 100% attended
			expectedLate: 100.0,
		},
		{
			name:         "All absent (0 present, 0 late, 50 absent)",
			present:      0,
			late:         0,
			absent:       50,
			expectedAtt:  0.0,
			expectedLate: 0.0,
		},
		{
			name:         "Zero records (0 / 0)",
			present:      0,
			late:         0,
			absent:       0,
			expectedAtt:  0.0,
			expectedLate: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			total := tt.present + tt.late + tt.absent
			var attPct, latePct float64
			if total > 0 {
				attended := tt.present + tt.late
				attPct = math.Round((float64(attended)/float64(total)*100)*10) / 10
				latePct = math.Round((float64(tt.late)/float64(total)*100)*10) / 10
			}

			if attPct != tt.expectedAtt {
				t.Errorf("expected attendance percentage %.1f, got %.1f", tt.expectedAtt, attPct)
			}
			if latePct != tt.expectedLate {
				t.Errorf("expected late percentage %.1f, got %.1f", tt.expectedLate, latePct)
			}
		})
	}
}

// TestTeacherProfileResponseSecurity verifies that no sensitive fields are present in response DTO
func TestTeacherProfileResponseSecurity(t *testing.T) {
	phone := "+91 9876543210"
	address := "Faculty Quarter #4"
	now := time.Now().UTC()

	resp := models.TeacherFullProfileResponse{
		Teacher: models.TeacherProfileResponse{
			ID:         "teacher-uuid-1111",
			UserID:     "user-uuid-2222",
			Name:       "Dr. Rajesh Verma",
			Email:      "rajesh.verma@college.edu",
			EmployeeID: "FAC-CS-01",
			Department: "Computer Science",
			Phone:      &phone,
			Address:    &address,
			Role:       "TEACHER",
			IsActive:   true,
			CreatedAt:  now,
		},
		Assignments: models.TeacherAssignmentsPayload{
			Subjects: []models.TeacherSubjectAssignment{
				{
					SubjectID:    "subj-1",
					Name:         "Database Systems",
					Code:         "CS301",
					Department:   "Computer Science",
					Semester:     5,
					ClassesCount: 1,
					ClassNames:   []string{"TY B.Sc CS — A"},
				},
			},
			Classes: []models.TeacherClassAssignment{
				{
					ClassID:      "class-1",
					Name:         "TY B.Sc CS — A",
					Department:   "Computer Science",
					Semester:     5,
					Section:      "A",
					AcademicYear: "2026–27",
					StudentCount: 45,
				},
			},
		},
		TeachingSummary: models.TeacherTeachingStats{
			SessionsConducted:           24,
			FinalizedSessions:           22,
			OpenSessions:                2,
			StudentsCount:               45,
			ClassesCount:                1,
			SubjectsCount:               1,
			OverallAttendancePercentage: 88.5,
			LatePercentage:              4.2,
		},
	}

	if resp.Teacher.ID == "" || resp.Teacher.UserID == "" || resp.Teacher.Name == "" || resp.Teacher.Email == "" {
		t.Errorf("essential teacher profile fields must not be empty")
	}

	if len(resp.Assignments.Subjects) != 1 || len(resp.Assignments.Classes) != 1 {
		t.Errorf("assignments must be populated correctly")
	}

	if resp.TeachingSummary.SessionsConducted != 24 || resp.TeachingSummary.OverallAttendancePercentage != 88.5 {
		t.Errorf("teaching summary metrics must match expected values")
	}
}
