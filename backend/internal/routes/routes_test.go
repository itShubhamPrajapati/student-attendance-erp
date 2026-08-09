package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func TestTeacherSessionRoutesRegistered(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cfg := &config.Config{
		JWTSecret:   "test-secret-key-that-is-at-least-32-chars-long",
		Environment: "development",
		FrontendURL: "http://localhost:5173",
	}

	router := SetupRouter(cfg)

	// Generate a valid teacher JWT token
	teacherToken, err := services.GenerateJWT(&models.User{
		ID:    "user-123",
		Role:  models.RoleTeacher,
		Email: "teacher@test.com",
		Name:  "Test Teacher",
	}, cfg.JWTSecret, 2)
	if err != nil {
		t.Fatalf("failed to generate teacher token: %v", err)
	}

	// Generate a valid student JWT token
	studentToken, err := services.GenerateJWT(&models.User{
		ID:    "user-456",
		Role:  models.RoleStudent,
		Email: "student@test.com",
		Name:  "Test Student",
	}, cfg.JWTSecret, 2)
	if err != nil {
		t.Fatalf("failed to generate student token: %v", err)
	}

	routesToTest := []struct {
		name   string
		method string
		path   string
		token  string
	}{
		{"Teacher Sessions List", "GET", "/api/teacher/attendance/sessions", teacherToken},
		{"Teacher Session By ID (Initial Load with QR Token)", "GET", "/api/teacher/attendance/sessions/12345", teacherToken},
		{"Teacher Live Session Telemetry Polling", "GET", "/api/teacher/attendance/sessions/12345/live", teacherToken},
		{"Teacher Session Records", "GET", "/api/teacher/attendance/sessions/12345/records", teacherToken},
		{"Teacher End Session", "POST", "/api/teacher/attendance/sessions/12345/end", teacherToken},
		{"Student Mark Attendance", "POST", "/api/attendance/mark", studentToken},
		{"Student Attendance Summary", "GET", "/api/student/attendance/summary", studentToken},
		{"Student Attendance Calendar", "GET", "/api/student/attendance/calendar", studentToken},
		{"Student Recent Attendance", "GET", "/api/student/attendance/recent", studentToken},
	}

	for _, rt := range routesToTest {
		t.Run(rt.name, func(t *testing.T) {
			req, _ := http.NewRequest(rt.method, rt.path, nil)
			req.Header.Set("Authorization", "Bearer "+rt.token)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// The route MUST be matched by Gin router.
			// It must NOT hit the NoRoute 404 fallback ("API route not found").
			if w.Code == http.StatusNotFound && w.Body.String() == `{"message":"API route not found","success":false}` {
				t.Fatalf("FAIL: Route [%s] %s returned 404 NoRoute (API route not found)", rt.method, rt.path)
			}
		})
	}
}
