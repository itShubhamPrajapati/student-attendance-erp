package services

import (
	"strings"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"
)

// TestGeneratePublicProofIDFormatAndUniqueness verifies generated public IDs match standard format and are unique
func TestGeneratePublicProofIDFormatAndUniqueness(t *testing.T) {
	seen := make(map[string]bool)
	currentYear := time.Now().UTC().Year()
	prefix := fmtSprintf("ATT-%d-", currentYear)

	for i := 0; i < 200; i++ {
		id, err := GeneratePublicProofID()
		if err != nil {
			t.Fatalf("GeneratePublicProofID returned error: %v", err)
		}

		if !strings.HasPrefix(id, prefix) {
			t.Errorf("expected proof ID to start with %q, got %q", prefix, id)
		}

		if len(id) != len(prefix)+12 {
			t.Errorf("expected proof ID length %d, got %d for %q", len(prefix)+12, len(id), id)
		}

		if seen[id] {
			t.Fatalf("collision detected for proof ID: %q", id)
		}
		seen[id] = true
	}
}

func fmtSprintf(format string, a ...interface{}) string {
	return strings.Replace(format, "%d", "2026", 1)
}

// TestGetStatusLabel verifies institutional status formatting
func TestGetStatusLabel(t *testing.T) {
	tests := []struct {
		status   string
		expected string
	}{
		{"PRESENT", "Present — On Time"},
		{"present", "Present — On Time"},
		{"LATE", "Late — Attendance Recorded"},
		{"late", "Late — Attendance Recorded"},
		{"ABSENT", "Absent"},
		{"absent", "Absent"},
		{"UNKNOWN", "UNKNOWN"},
	}

	for _, tt := range tests {
		actual := GetStatusLabel(tt.status)
		if actual != tt.expected {
			t.Errorf("for status %q, expected label %q, got %q", tt.status, tt.expected, actual)
		}
	}
}

// TestGenerateAttendanceProofPDF_Present verifies PDF generation for PRESENT attendance
func TestGenerateAttendanceProofPDF_Present(t *testing.T) {
	sampleProof := &models.AttendanceProofResponse{
		ProofID:              "prf-12345",
		PublicID:             "ATT-2026-F98AK2L4M8NP",
		VerificationURL:      "http://localhost:5173/verify/attendance/ATT-2026-F98AK2L4M8NP",
		VerificationStatus:   "VALID",
		AttendanceID:         "att-12345",
		StudentID:            "std-12345",
		StudentName:          "Aarav Sharma",
		RollNumber:           "CS2026-042",
		Email:                "aarav.sharma@college.edu",
		Department:           "Computer Science",
		Semester:             4,
		Section:              "A",
		ClassName:            "B.Tech CSE - 4th Sem (A)",
		SubjectID:            "sub-101",
		SubjectName:          "Database Management Systems",
		SubjectCode:          "CS402",
		TeacherName:          "Dr. Vikram Mehta",
		TeacherDepartment:    "Computer Science & Engineering",
		SessionID:            "sess-12345",
		SessionDate:          "2026-08-12",
		SessionStartTime:     "09:30",
		SessionEndTime:       "10:30",
		AttendanceMarkedAt:   time.Now().UTC(),
		AttendanceStatus:     models.StatusPresent,
		StatusLabel:          "Present — On Time",
		LateThresholdMinutes: 10,
		CollegeName:          "Apex Institute of Technology",
		GeneratedAt:          time.Now().UTC(),
	}

	pdfBytes, err := GenerateAttendanceProofPDF(sampleProof)
	if err != nil {
		t.Fatalf("GenerateAttendanceProofPDF failed: %v", err)
	}

	if len(pdfBytes) == 0 {
		t.Fatalf("expected non-empty PDF bytes")
	}

	// PDF magic header
	if !strings.HasPrefix(string(pdfBytes[:8]), "%PDF-") {
		t.Errorf("output missing %%PDF- magic header")
	}
}

// TestGenerateAttendanceProofPDF_Late verifies PDF generation for LATE attendance
func TestGenerateAttendanceProofPDF_Late(t *testing.T) {
	sampleProof := &models.AttendanceProofResponse{
		ProofID:              "prf-67890",
		PublicID:             "ATT-2026-K8L9M2N3P4Q5",
		VerificationURL:      "http://localhost:5173/verify/attendance/ATT-2026-K8L9M2N3P4Q5",
		VerificationStatus:   "VALID",
		AttendanceID:         "att-67890",
		StudentID:            "std-67890",
		StudentName:          "Priya Patel",
		RollNumber:           "CS2026-089",
		Email:                "priya.patel@college.edu",
		Department:           "Computer Science",
		Semester:             4,
		Section:              "A",
		ClassName:            "B.Tech CSE - 4th Sem (A)",
		SubjectID:            "sub-102",
		SubjectName:          "Operating Systems",
		SubjectCode:          "CS403",
		TeacherName:          "Prof. Sunita Rao",
		TeacherDepartment:    "Computer Science & Engineering",
		SessionID:            "sess-67890",
		SessionDate:          "2026-08-12",
		SessionStartTime:     "11:00",
		SessionEndTime:       "12:00",
		AttendanceMarkedAt:   time.Now().UTC(),
		AttendanceStatus:     models.StatusLate,
		StatusLabel:          "Late — Attendance Recorded",
		LateThresholdMinutes: 10,
		CollegeName:          "Apex Institute of Technology",
		GeneratedAt:          time.Now().UTC(),
	}

	pdfBytes, err := GenerateAttendanceProofPDF(sampleProof)
	if err != nil {
		t.Fatalf("GenerateAttendanceProofPDF failed for LATE attendance: %v", err)
	}

	if len(pdfBytes) == 0 {
		t.Fatalf("expected non-empty PDF bytes for LATE attendance")
	}
}

// TestGenerateAttendanceProofPDF_Absent verifies PDF generation for ABSENT attendance
func TestGenerateAttendanceProofPDF_Absent(t *testing.T) {
	sampleProof := &models.AttendanceProofResponse{
		ProofID:              "prf-99999",
		PublicID:             "ATT-2026-X1Y2Z3W4V5U6",
		VerificationURL:      "http://localhost:5173/verify/attendance/ATT-2026-X1Y2Z3W4V5U6",
		VerificationStatus:   "VALID",
		AttendanceID:         "att-99999",
		StudentID:            "std-99999",
		StudentName:          "Rohan Verma",
		RollNumber:           "CS2026-105",
		Email:                "rohan.verma@college.edu",
		Department:           "Computer Science",
		Semester:             4,
		Section:              "A",
		ClassName:            "B.Tech CSE - 4th Sem (A)",
		SubjectID:            "sub-103",
		SubjectName:          "Computer Networks",
		SubjectCode:          "CS404",
		TeacherName:          "Dr. Vikram Mehta",
		TeacherDepartment:    "Computer Science & Engineering",
		SessionID:            "sess-99999",
		SessionDate:          "2026-08-12",
		SessionStartTime:     "14:00",
		SessionEndTime:       "15:00",
		AttendanceMarkedAt:   time.Time{},
		AttendanceStatus:     models.StatusAbsent,
		StatusLabel:          "Absent",
		LateThresholdMinutes: 10,
		CollegeName:          "Apex Institute of Technology",
		GeneratedAt:          time.Now().UTC(),
	}

	pdfBytes, err := GenerateAttendanceProofPDF(sampleProof)
	if err != nil {
		t.Fatalf("GenerateAttendanceProofPDF failed for ABSENT attendance: %v", err)
	}

	if len(pdfBytes) == 0 {
		t.Fatalf("expected non-empty PDF bytes for ABSENT attendance")
	}
}
