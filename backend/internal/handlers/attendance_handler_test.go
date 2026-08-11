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

// TestManualAttendanceHandlerValidation verifies validation & status mappings for manual attendance
func TestManualAttendanceHandlerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         string
		userRole       string
		body           interface{}
		expectedStatus int
		expectInBody   string
	}{
		{
			name:           "Unauthenticated request returns 401 Unauthorized",
			userID:         "",
			userRole:       "",
			body:           map[string]interface{}{"session_id": "sess-1", "student_id": "stud-1", "status": "PRESENT", "reason": "Valid reason text"},
			expectedStatus: http.StatusUnauthorized,
			expectInBody:   "Authentication required",
		},
		{
			name:           "Empty JSON body returns 400 Bad Request",
			userID:         "user-teacher-1",
			userRole:       models.RoleTeacher,
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "required",
		},
		{
			name:           "Missing reason in body returns 400 Bad Request",
			userID:         "user-teacher-1",
			userRole:       models.RoleTeacher,
			body:           map[string]interface{}{"session_id": "sess-1", "student_id": "stud-1", "status": "PRESENT"},
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.POST("/api/teacher/attendance/manual", func(c *gin.Context) {
				if tt.userID != "" {
					c.Set("user_id", tt.userID)
					c.Set("user_role", tt.userRole)
				}
				MarkAttendanceManuallyHandler(nil)(c)
			})

			bodyBytes, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest(http.MethodPost, "/api/teacher/attendance/manual", bytes.NewBuffer(bodyBytes))
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

// TestCorrectAttendanceHandlerValidation verifies validation & status mappings for attendance correction
func TestCorrectAttendanceHandlerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		userID         string
		userRole       string
		attendanceID   string
		body           interface{}
		expectedStatus int
		expectInBody   string
	}{
		{
			name:           "Unauthenticated request returns 401 Unauthorized",
			userID:         "",
			userRole:       "",
			attendanceID:   "att-123",
			body:           map[string]interface{}{"status": "ABSENT", "reason": "Correcting error"},
			expectedStatus: http.StatusUnauthorized,
			expectInBody:   "Authentication required",
		},
		{
			name:           "Missing status and reason returns 400 Bad Request",
			userID:         "user-teacher-1",
			userRole:       models.RoleTeacher,
			attendanceID:   "att-123",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			r.PATCH("/api/teacher/attendance/:attendance_id/correct", func(c *gin.Context) {
				if tt.userID != "" {
					c.Set("user_id", tt.userID)
					c.Set("user_role", tt.userRole)
				}
				CorrectAttendanceHandler(nil)(c)
			})

			bodyBytes, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest(http.MethodPatch, "/api/teacher/attendance/"+tt.attendanceID+"/correct", bytes.NewBuffer(bodyBytes))
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

// TestGetAttendanceAuditHandlerValidation verifies unauthenticated access is rejected
func TestGetAttendanceAuditHandlerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.GET("/api/teacher/attendance/:attendance_id/audit", func(c *gin.Context) {
		GetAttendanceAuditHandler(nil)(c)
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/teacher/attendance/att-123/audit", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for unauthenticated audit request, got %d", w.Code)
	}
}

