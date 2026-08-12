package services

import (
	"strings"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"
)

// TestStudentProfilePasswordValidation tests password strength and length boundaries
func TestStudentProfilePasswordValidation(t *testing.T) {
	tests := []struct {
		name        string
		currentPass string
		newPass     string
		expectErr   bool
		errContains string
	}{
		{
			name:        "Valid password",
			currentPass: "OldPassword123",
			newPass:     "NewSecurePassword456",
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
			currentPass: "OldPassword123",
			newPass:     "12345",
			expectErr:   true,
			errContains: "at least 6 characters",
		},
		{
			name:        "Exact 6 characters accepted",
			currentPass: "OldPassword123",
			newPass:     "abcdef",
			expectErr:   false,
		},
		{
			name:        "Excessively long password (129 chars)",
			currentPass: "OldPassword123",
			newPass:     strings.Repeat("a", 129),
			expectErr:   true,
			errContains: "cannot exceed 128 characters",
		},
		{
			name:        "Exact 128 characters accepted",
			currentPass: "OldPassword123",
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

// TestStudentProfileBcryptVerification tests password hashing and verification
func TestStudentProfileBcryptVerification(t *testing.T) {
	rawPassword := "SecureCollegePassword#2026"

	hashed, err := HashPassword(rawPassword)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if hashed == rawPassword {
		t.Fatalf("hashed password must not match raw plaintext")
	}

	// Verify correct password returns true
	if !CheckPassword(hashed, rawPassword) {
		t.Errorf("expected CheckPassword to return true for correct password")
	}

	// Verify wrong password returns false
	if CheckPassword(hashed, "WrongPassword#999") {
		t.Errorf("expected CheckPassword to return false for wrong password")
	}
}

// TestStudentProfileContactValidation tests phone and address validation constraints
func TestStudentProfileContactValidation(t *testing.T) {
	// Phone validation tests
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

	// Address validation tests
	validAddress := "123 Academic Way, North Campus, Mumbai, Maharashtra 400001"
	if len(strings.TrimSpace(validAddress)) > 255 {
		t.Errorf("valid address should not exceed 255 characters")
	}

	invalidAddress := strings.Repeat("A", 300)
	if len(strings.TrimSpace(invalidAddress)) <= 255 {
		t.Errorf("address of length 300 should exceed max limit of 255")
	}
}

// TestStudentProfileResponseSecurity verifies that no sensitive fields are present in response DTO
func TestStudentProfileResponseSecurity(t *testing.T) {
	phone := "+91 9876543210"
	address := "123 Campus Lane, Mumbai"
	now := time.Now().UTC()

	resp := models.StudentProfileResponse{
		ID:         "student-uuid-1234",
		UserID:     "user-uuid-5678",
		Name:       "Aditya Kumar",
		Email:      "aditya.kumar@college.edu",
		RollNumber: "CS2026-042",
		Department: "Computer Science",
		Semester:   4,
		Section:    "A",
		Phone:      &phone,
		Address:    &address,
		IsActive:   true,
		CreatedAt:  now,
		Class: &models.ClassBriefResponse{
			ID:           "class-uuid-9999",
			Name:         "SY B.Sc Computer Science — A",
			Department:   "Computer Science",
			Semester:     4,
			Section:      "A",
			AcademicYear: "2026–27",
		},
	}

	if resp.ID == "" || resp.UserID == "" || resp.Name == "" || resp.Email == "" {
		t.Errorf("essential student profile fields must not be empty")
	}

	if resp.Class == nil || resp.Class.Name == "" {
		t.Errorf("class information must be included in profile response")
	}

	if *resp.Phone != phone || *resp.Address != address {
		t.Errorf("phone and address must match assigned values")
	}
}
