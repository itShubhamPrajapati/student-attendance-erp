package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// TestAttendanceHandlerErrorMapping verifies HTTP status codes returned by attendance error conditions
func TestAttendanceHandlerErrorMapping(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		setupBody      map[string]interface{}
		expectedStatus int
		expectInBody   string
	}{
		{
			name: "Missing session token returns 400 Bad Request",
			setupBody: map[string]interface{}{
				"session_token": "",
			},
			expectedStatus: http.StatusBadRequest,
			expectInBody:   "Please provide a valid session token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := gin.New()
			// MarkAttendanceHandler expects user_id in context
			r.POST("/api/attendance/mark", func(c *gin.Context) {
				c.Set("user_id", "test-student-id")
				MarkAttendanceHandler(nil)(c)
			})

			bodyBytes, _ := json.Marshal(tt.setupBody)
			req, _ := http.NewRequest(http.MethodPost, "/api/attendance/mark", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d. Body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}
		})
	}
}
