package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qr-attendance-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// TestAttendanceHandlerErrorMapping verifies HTTP status codes returned by attendance error conditions
func TestAttendanceHandlerErrorMapping(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         string
		setupBody      interface{}
		expectedStatus int
		expectInBody   string
	}{
		{
			name:           "Unauthenticated request returns 401 Unauthorized",
			userID:         "",
			setupBody:      map[string]interface{}{"session_token": "tok-123"},
			expectedStatus: http.StatusUnauthorized,
			expectInBody:   "Authentication required",
		},
		{
			name:           "Missing session token returns 400 Bad Request",
			userID:         "test-student-id",
			setupBody:      map[string]interface{}{"session_token": ""},
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "Please provide a valid session token",
		},
		{
			name:           "Malformed JSON payload returns 400 Bad Request",
			userID:         "test-student-id",
			setupBody:      "not-valid-json",
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "Please provide a valid session token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.POST("/api/attendance/mark", func(c *gin.Context) {
				if tt.userID != "" {
					c.Set("user_id", tt.userID)
				}
				MarkAttendanceHandler(nil)(c)
			})

			var bodyBytes []byte
			if strBody, ok := tt.setupBody.(string); ok {
				bodyBytes = []byte(strBody)
			} else {
				bodyBytes, _ = json.Marshal(tt.setupBody)
			}

			req, _ := http.NewRequest(http.MethodPost, "/api/attendance/mark", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d. Body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
			if tt.expectInBody != "" && !bytes.Contains(w.Body.Bytes(), []byte(tt.expectInBody)) {
				t.Errorf("expected body to contain %q, got: %s", tt.expectInBody, w.Body.String())
			}
		})
	}
}

// TestLiveAttendanceSessionResponseSecurity ensures session_token is never serialized in LiveAttendanceSessionResponse
func TestLiveAttendanceSessionResponseSecurity(t *testing.T) {
	resp := models.LiveAttendanceSessionResponse{
		SessionID:            "sess-123",
		Status:               "ACTIVE",
		TotalStudents:        40,
		PresentCount:         30,
		AbsentCount:          10,
		AttendancePercentage: 75.0,
		QRExpiresAt:          time.Now().Add(10 * time.Minute),
		StartedAt:            time.Now(),
		DurationMinutes:      15,
		IsActive:             true,
		IsExpired:            false,
		SubjectName:          "Computer Networks",
		SubjectCode:          "CS301",
		ClassName:            "TY-A",
		Semester:             5,
		Section:              "A",
		Students:             []models.AttendanceStudentRecord{},
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("failed to marshal LiveAttendanceSessionResponse: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal JSON: %v", err)
	}

	if _, exists := parsed["session_token"]; exists {
		t.Fatalf("SECURITY VIOLATION: LiveAttendanceSessionResponse JSON contains session_token! Expected field to be absent.")
	}
}
