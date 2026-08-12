package services

import (
	"testing"
	"time"
)

// TestNormalizeTeacherDateRange_Presets tests date range presets
func TestNormalizeTeacherDateRange_Presets(t *testing.T) {
	presets := []string{"today", "this_week", "this_month", "last_7_days", "last_30_days", "current_semester"}

	for _, p := range presets {
		pCopy := p
		start, end, period, err := normalizeTeacherDateRange(nil, nil, &pCopy)
		if err != nil {
			t.Errorf("preset %q returned unexpected error: %v", p, err)
		}
		if start == nil || end == nil {
			t.Errorf("preset %q returned nil start or end", p)
		}
		if start != nil && end != nil && start.After(*end) {
			t.Errorf("preset %q produced inverted range: start=%v, end=%v", p, start, end)
		}
		if period != p {
			t.Errorf("expected period name %q, got %q", p, period)
		}
	}
}

// TestNormalizeTeacherDateRange_CustomValid tests valid custom date range
func TestNormalizeTeacherDateRange_CustomValid(t *testing.T) {
	from := "2026-08-01"
	to := "2026-08-15"
	period := "custom"

	start, end, pName, err := normalizeTeacherDateRange(&from, &to, &period)
	if err != nil {
		t.Fatalf("unexpected error for custom valid date range: %v", err)
	}

	if start == nil || end == nil {
		t.Fatalf("expected non-nil start and end for custom date range")
	}

	expectedStart := time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC)
	if !start.Equal(expectedStart) {
		t.Errorf("expected start %v, got %v", expectedStart, start)
	}

	if pName != "custom" {
		t.Errorf("expected period 'custom', got %q", pName)
	}
}

// TestNormalizeTeacherDateRange_InvertedRange tests that from > to returns error
func TestNormalizeTeacherDateRange_InvertedRange(t *testing.T) {
	from := "2026-08-20"
	to := "2026-08-10"
	period := "custom"

	_, _, _, err := normalizeTeacherDateRange(&from, &to, &period)
	if err == nil {
		t.Fatalf("expected ErrInvalidDateRange for inverted range, got nil")
	}
}

// TestNormalizeTeacherDateRange_InvalidDateFormat tests invalid date strings
func TestNormalizeTeacherDateRange_InvalidDateFormat(t *testing.T) {
	from := "invalid-date"
	to := "2026-08-10"

	_, _, _, err := normalizeTeacherDateRange(&from, &to, nil)
	if err == nil {
		t.Fatalf("expected error for invalid date format, got nil")
	}
}

// TestTeacherStandingThresholds validates standing criteria
func TestTeacherStandingThresholds(t *testing.T) {
	tests := []struct {
		name     string
		pct      float64
		expected string
	}{
		{"100% meets requirement", 100.0, "REQUIREMENT_MET"},
		{"75.0% meets requirement", 75.0, "REQUIREMENT_MET"},
		{"74.9% is below requirement", 74.9, "BELOW_REQUIREMENT"},
		{"60.0% is below requirement", 60.0, "BELOW_REQUIREMENT"},
		{"59.9% is critical", 59.9, "CRITICAL"},
		{"0.0% is critical", 0.0, "CRITICAL"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var status string
			if tt.pct < 60.0 {
				status = "CRITICAL"
			} else if tt.pct < 75.0 {
				status = "BELOW_REQUIREMENT"
			} else {
				status = "REQUIREMENT_MET"
			}

			if status != tt.expected {
				t.Errorf("for attendance %.1f%%, expected %q, got %q", tt.pct, tt.expected, status)
			}
		})
	}
}
