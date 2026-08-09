package handlers

import (
	"net/http"
	"strings"

	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==============================================================================
// TEACHER ATTENDANCE HANDLERS (RequireRole: TEACHER)
// ==============================================================================

// CreateAttendanceSessionHandler handles POST /api/teacher/attendance/sessions
func CreateAttendanceSessionHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		var input services.CreateSessionInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide a valid subject, class, and session duration (1-60 minutes)",
			})
			return
		}

		session, err := services.CreateAttendanceSession(db, userID, &input)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not authorized") || strings.Contains(errMsg, "inactive") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create attendance session: " + errMsg,
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Attendance session started successfully",
			"data":    session,
		})
	}
}

// GetTeacherSessionsHandler handles GET /api/teacher/attendance/sessions
func GetTeacherSessionsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		subjectFilter := c.Query("subject_id")
		classFilter := c.Query("class_id")
		dateFilter := c.Query("date")
		statusFilter := c.Query("status")

		sessions, err := services.GetTeacherSessions(db, userID, subjectFilter, classFilter, dateFilter, statusFilter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve attendance sessions",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    sessions,
		})
	}
}

// GetTeacherSessionByIDHandler handles GET /api/teacher/attendance/sessions/:id
func GetTeacherSessionByIDHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		sessionID := c.Param("id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		session, err := services.GetTeacherSessionByID(db, userID, sessionID)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "access denied") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve session details",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    session,
		})
	}
}

// EndAttendanceSessionHandler handles POST /api/teacher/attendance/sessions/:id/end
func EndAttendanceSessionHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		sessionID := c.Param("id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		if err := services.EndAttendanceSession(db, userID, sessionID); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "not owned") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to end attendance session",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Attendance session ended successfully",
		})
	}
}

// GetTeacherSessionRecordsHandler handles GET /api/teacher/attendance/sessions/:id/records
func GetTeacherSessionRecordsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		sessionID := c.Param("id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		details, err := services.GetSessionAttendanceRecords(db, sessionID, &userID)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "access denied") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve session records",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    details,
		})
	}
}

// ==============================================================================
// STUDENT ATTENDANCE HANDLERS (RequireRole: STUDENT)
// ==============================================================================

// MarkAttendanceHandler handles POST /api/attendance/mark
func MarkAttendanceHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		var input services.MarkAttendanceInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide a valid session token",
			})
			return
		}

		result, err := services.MarkStudentAttendance(db, userID, input.SessionToken)
		if err != nil {
			errMsg := err.Error()

			// 1. Duplicate attendance (409 Conflict)
			if strings.Contains(errMsg, "already been marked") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			// 2. Expired session (410 Gone)
			if strings.Contains(errMsg, "expired") {
				c.JSON(http.StatusGone, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			// 3. Wrong class (403 Forbidden)
			if strings.Contains(errMsg, "not enrolled in this class") || strings.Contains(errMsg, "not assigned to an academic class") {
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			// 4. Inactive or ended session (400 Bad Request)
			if strings.Contains(errMsg, "ended") {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			// 5. Invalid token (404 Not Found)
			if strings.Contains(errMsg, "Invalid QR code") || strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Unable to verify attendance: " + errMsg,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Attendance marked successfully",
			"data":    result,
		})
	}
}

// GetStudentAttendanceSummaryHandler handles GET /api/student/attendance/summary
func GetStudentAttendanceSummaryHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		summary, err := services.GetStudentAttendanceSummary(db, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to compute attendance summary",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    summary,
		})
	}
}

// GetStudentRecentAttendanceHandler handles GET /api/student/attendance/recent
func GetStudentRecentAttendanceHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		recent, err := services.GetStudentRecentAttendance(db, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve recent attendance logs",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    recent,
		})
	}
}

// ==============================================================================
// ADMIN ATTENDANCE HANDLERS (RequireRole: ADMIN)
// ==============================================================================

// GetAdminAttendanceSessionsHandler handles GET /api/admin/attendance/sessions
func GetAdminAttendanceSessionsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		dateFilter := c.Query("date")
		subjectFilter := c.Query("subject_id")
		classFilter := c.Query("class_id")

		sessions, err := services.GetAdminAttendanceSessions(db, dateFilter, subjectFilter, classFilter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve system attendance records",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    sessions,
		})
	}
}

// GetAdminSessionRecordsHandler handles GET /api/admin/attendance/sessions/:id/records
func GetAdminSessionRecordsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.Param("id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		// nil teacherUserID allows admin to audit any session
		details, err := services.GetSessionAttendanceRecords(db, sessionID, nil)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve session records",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    details,
		})
	}
}
