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

	// Generate a valid admin JWT token
	adminToken, err := services.GenerateJWT(&models.User{
		ID:    "user-789",
		Role:  models.RoleAdmin,
		Email: "admin@test.com",
		Name:  "Test Admin",
	}, cfg.JWTSecret, 2)
	if err != nil {
		t.Fatalf("failed to generate admin token: %v", err)
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
		{"Teacher Finalize Session", "POST", "/api/teacher/attendance/sessions/12345/finalize", teacherToken},
		{"Teacher Session Audit History", "GET", "/api/teacher/attendance/sessions/12345/audit", teacherToken},
		{"Teacher Student Search", "GET", "/api/teacher/students/search", teacherToken},
		{"Teacher Student Attendance Detail", "GET", "/api/teacher/students/12345/attendance", teacherToken},
		{"Teacher Attendance Export CSV", "GET", "/api/teacher/attendance/export/csv", teacherToken},
		{"Teacher Attendance Export Excel", "GET", "/api/teacher/attendance/export/excel", teacherToken},
		{"Teacher Attendance Export PDF", "GET", "/api/teacher/attendance/export/pdf", teacherToken},
		{"Teacher Student Detail Export CSV", "GET", "/api/teacher/students/12345/attendance/export/csv", teacherToken},
		{"Teacher Student Detail Export Excel", "GET", "/api/teacher/students/12345/attendance/export/excel", teacherToken},
		{"Teacher Student Detail Export PDF", "GET", "/api/teacher/students/12345/attendance/export/pdf", teacherToken},
		{"Teacher Manual Attendance Mark", "POST", "/api/teacher/attendance/manual", teacherToken},
		{"Teacher Attendance Correction", "PATCH", "/api/teacher/attendance/12345/correct", teacherToken},
		{"Teacher Attendance Audit History", "GET", "/api/teacher/attendance/12345/audit", teacherToken},
		{"Teacher Update Late Settings", "PATCH", "/api/teacher/attendance/sessions/12345/late-settings", teacherToken},
		{"Admin Finalize Session", "POST", "/api/admin/attendance/sessions/12345/finalize", adminToken},
		{"Admin Reopen Session", "POST", "/api/admin/attendance/sessions/12345/reopen", adminToken},
		{"Admin Session Audit History", "GET", "/api/admin/attendance/sessions/12345/audit", adminToken},
		{"Student Mark Attendance", "POST", "/api/attendance/mark", studentToken},
		{"Student Attendance Summary", "GET", "/api/student/attendance/summary", studentToken},
		{"Student Attendance Calendar", "GET", "/api/student/attendance/calendar", studentToken},
		{"Student Attendance History", "GET", "/api/student/attendance/history", studentToken},
		{"Student Attendance Analytics", "GET", "/api/student/attendance/analytics", studentToken},
		{"Student Recent Attendance", "GET", "/api/student/attendance/recent", studentToken},
		{"Student Attendance Proof", "GET", "/api/student/attendance/12345/proof", studentToken},
		{"Student Attendance Proof PDF", "GET", "/api/student/attendance/12345/proof/pdf", studentToken},
		{"Teacher Attendance Proof", "GET", "/api/teacher/attendance/12345/proof", teacherToken},
		{"Teacher Attendance Proof PDF", "GET", "/api/teacher/attendance/12345/proof/pdf", teacherToken},
		{"Teacher Attendance Analytics", "GET", "/api/teacher/attendance/analytics", teacherToken},
		{"Admin Attendance Proof", "GET", "/api/admin/attendance/12345/proof", adminToken},
		{"Admin Attendance Proof PDF", "GET", "/api/admin/attendance/12345/proof/pdf", adminToken},
		{"Recent Activity Student", "GET", "/api/activity/recent", studentToken},
		{"Recent Activity Teacher", "GET", "/api/activity/recent", teacherToken},
		{"Recent Activity Admin", "GET", "/api/activity/recent", adminToken},
		{"Student Profile Get", "GET", "/api/student/profile", studentToken},
		{"Student Profile Patch", "PATCH", "/api/student/profile", studentToken},
		{"Student Account Password Patch", "PATCH", "/api/student/account/password", studentToken},
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
