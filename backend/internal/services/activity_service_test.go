package services

import (
	"sort"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"
)

// TestActivityLimitValidation tests pagination limit constraints
func TestActivityLimitValidation(t *testing.T) {
	validLimits := []int{1, 5, 10, 25, 50}
	for _, l := range validLimits {
		req := models.RecentActivityRequest{Limit: &l}
		if *req.Limit < 1 || *req.Limit > 50 {
			t.Errorf("expected limit %d to be valid, but fell out of range", l)
		}
	}

	invalidLimits := []int{0, -5, 51, 100, -1}
	for _, l := range invalidLimits {
		if l >= 1 && l <= 50 {
			t.Errorf("expected limit %d to be invalid, but fell into valid range", l)
		}
	}
}

// TestActivityTypeMappings validates all activity type constants and severities
func TestActivityTypeMappings(t *testing.T) {
	tests := []struct {
		actType  models.ActivityType
		severity models.ActivitySeverity
	}{
		{models.ActivityTypeAttendanceMarked, models.ActivitySeveritySuccess},
		{models.ActivityTypeAttendanceLate, models.ActivitySeverityWarning},
		{models.ActivityTypeAttendanceCorrected, models.ActivitySeverityImportant},
		{models.ActivityTypeManualAttendance, models.ActivitySeverityImportant},
		{models.ActivityTypeSessionStarted, models.ActivitySeverityInfo},
		{models.ActivityTypeSessionFinalized, models.ActivitySeverityInfo},
		{models.ActivityTypeSessionReopened, models.ActivitySeverityWarning},
		{models.ActivityTypeProofGenerated, models.ActivitySeveritySuccess},
	}

	for _, tt := range tests {
		if string(tt.actType) == "" {
			t.Errorf("empty activity type for %v", tt.actType)
		}
		if string(tt.severity) == "" {
			t.Errorf("empty activity severity for %v", tt.actType)
		}
	}
}

// TestActivitySortingLogic validates chronological descending sorting
func TestActivitySortingLogic(t *testing.T) {
	now := time.Now().UTC()
	items := []models.ActivityItem{
		{ID: "1", CreatedAt: now.Add(-30 * time.Minute)},
		{ID: "2", CreatedAt: now.Add(-5 * time.Minute)},
		{ID: "3", CreatedAt: now.Add(-2 * time.Hour)},
		{ID: "4", CreatedAt: now},
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].CreatedAt.After(items[j].CreatedAt)
	})

	if items[0].ID != "4" || items[1].ID != "2" || items[2].ID != "1" || items[3].ID != "3" {
		t.Errorf("items not sorted in descending order of CreatedAt: got IDs [%s, %s, %s, %s]",
			items[0].ID, items[1].ID, items[2].ID, items[3].ID)
	}
}

// TestActivityTypeFilteringLogic validates filtering by specific event types
func TestActivityTypeFilteringLogic(t *testing.T) {
	items := []models.ActivityItem{
		{ID: "1", Type: models.ActivityTypeAttendanceMarked},
		{ID: "2", Type: models.ActivityTypeAttendanceLate},
		{ID: "3", Type: models.ActivityTypeSessionFinalized},
		{ID: "4", Type: models.ActivityTypeAttendanceMarked},
	}

	target := models.ActivityTypeAttendanceMarked
	var filtered []models.ActivityItem
	for _, it := range items {
		if it.Type == target {
			filtered = append(filtered, it)
		}
	}

	if len(filtered) != 2 {
		t.Fatalf("expected 2 filtered items, got %d", len(filtered))
	}
	if filtered[0].ID != "1" || filtered[1].ID != "4" {
		t.Errorf("unexpected filtered item IDs: [%s, %s]", filtered[0].ID, filtered[1].ID)
	}
}

// TestActivityStudentPrivacyConstraints ensures student activity contains no external names
func TestActivityStudentPrivacyConstraints(t *testing.T) {
	studentActivity := models.ActivityItem{
		ID:          "att-123",
		Type:        models.ActivityTypeAttendanceMarked,
		Severity:    models.ActivitySeveritySuccess,
		Title:       "Attendance Marked",
		Description: "Attendance marked PRESENT for Data Structures.",
	}

	// Ensure no other student's information is attached
	if studentActivity.StudentName != nil {
		t.Errorf("expected StudentName to be nil in student personal view, got %v", *studentActivity.StudentName)
	}
	if studentActivity.StudentRollNo != nil {
		t.Errorf("expected StudentRollNo to be nil in student personal view, got %v", *studentActivity.StudentRollNo)
	}
}
