package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"
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

// GetTeacherLiveSessionHandler handles GET /api/teacher/attendance/sessions/:id/live
func GetTeacherLiveSessionHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		sessionID := c.Param("id")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		liveData, err := services.GetLiveSessionData(db, userID, sessionID)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "access denied") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve live session telemetry",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    liveData,
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
			if errors.Is(err, services.ErrDuplicateAttendance) || strings.Contains(errMsg, "already been marked") || strings.Contains(errMsg, "duplicate") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": "Attendance has already been marked for this session.",
				})
				return
			}

			// 2. Expired session (410 Gone)
			if errors.Is(err, services.ErrSessionExpired) || strings.Contains(errMsg, "expired") {
				c.JSON(http.StatusGone, gin.H{
					"success": false,
					"message": "This attendance session has expired.",
				})
				return
			}

			// 3. Inactive or ended session (400 Bad Request)
			if errors.Is(err, services.ErrSessionEnded) || strings.Contains(errMsg, "ended") {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Attendance session has ended.",
				})
				return
			}

			// 4. Missing or empty token (400 Bad Request)
			if errors.Is(err, services.ErrSessionTokenRequired) || strings.Contains(errMsg, "token is required") {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Session token is required.",
				})
				return
			}

			// 5. Wrong class or inactive student profile (403 Forbidden)
			if errors.Is(err, services.ErrWrongClass) || errors.Is(err, services.ErrStudentAccountInactive) || errors.Is(err, services.ErrStudentNotAssignedClass) ||
				strings.Contains(errMsg, "not enrolled in this class") || strings.Contains(errMsg, "not assigned to an academic class") || strings.Contains(errMsg, "account is inactive") {
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			// 6. Invalid token or profile not found (404 Not Found)
			if errors.Is(err, services.ErrInvalidSessionToken) || errors.Is(err, services.ErrStudentProfileNotFound) ||
				strings.Contains(errMsg, "Invalid QR code") || strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Unable to verify attendance. Please try again.",
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

// GetStudentAttendanceCalendarHandler handles GET /api/student/attendance/calendar
func GetStudentAttendanceCalendarHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		monthParam := c.Query("month")
		subjectParam := c.Query("subject_id")

		calendarData, err := services.GetStudentAttendanceCalendar(db, userID, monthParam, subjectParam)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to compute attendance calendar",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    calendarData,
		})
	}
}

// GetStudentAttendanceHistoryHandler handles GET /api/student/attendance/history
func GetStudentAttendanceHistoryHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		subjectID := c.Query("subject_id")
		statusFilter := c.Query("status")
		fromDate := c.Query("from")
		toDate := c.Query("to")
		searchQuery := c.Query("search")

		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

		historyData, err := services.GetStudentAttendanceHistory(
			db,
			userID,
			subjectID,
			statusFilter,
			fromDate,
			toDate,
			searchQuery,
			page,
			limit,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve attendance history",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    historyData,
		})
	}
}

// GetStudentAttendanceAnalyticsHandler handles GET /api/student/attendance/analytics
func GetStudentAttendanceAnalyticsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		subjectIDParam := strings.TrimSpace(c.Query("subject_id"))
		fromParam := strings.TrimSpace(c.Query("from"))
		toParam := strings.TrimSpace(c.Query("to"))

		var subjectID *string
		if subjectIDParam != "" {
			subjectID = &subjectIDParam
		}

		var fromDate *string
		var toDate *string

		const dateLayout = "2006-01-02"

		if fromParam != "" {
			fromT, err := time.Parse(dateLayout, fromParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'from' date format. Expected YYYY-MM-DD",
				})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
					})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "'from' date cannot be after 'to' date",
					})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
				})
				return
			}
			toDate = &toParam
		}

		analytics, err := services.GetStudentAttendanceAnalytics(db, userID, subjectID, fromDate, toDate)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "access denied") {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to compute attendance analytics",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    analytics,
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

// ==============================================================================
// TEACHER STUDENT ATTENDANCE SEARCH HANDLERS (Feature #9)
// ==============================================================================

// SearchTeacherStudentsHandler handles GET /api/teacher/students/search
func SearchTeacherStudentsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		query := strings.TrimSpace(c.Query("q"))
		classIDParam := strings.TrimSpace(c.Query("class_id"))
		subjectIDParam := strings.TrimSpace(c.Query("subject_id"))
		statusParam := strings.TrimSpace(c.Query("status"))
		fromParam := strings.TrimSpace(c.Query("from"))
		toParam := strings.TrimSpace(c.Query("to"))
		sortBy := strings.TrimSpace(c.DefaultQuery("sort", "name"))
		sortOrder := strings.TrimSpace(c.DefaultQuery("order", "asc"))

		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", c.DefaultQuery("limit", "20")))

		var classID *string
		if classIDParam != "" {
			classID = &classIDParam
		}

		var subjectID *string
		if subjectIDParam != "" {
			subjectID = &subjectIDParam
		}

		var statusFilter *string
		if statusParam != "" {
			statusFilter = &statusParam
		}

		var fromDate *string
		var toDate *string
		const dateLayout = "2006-01-02"

		if fromParam != "" {
			fromT, err := time.Parse(dateLayout, fromParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'from' date format. Expected YYYY-MM-DD",
				})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
					})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "'from' date cannot be after 'to' date",
					})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
				})
				return
			}
			toDate = &toParam
		}

		res, err := services.SearchTeacherStudents(
			db,
			userID,
			query,
			classID,
			subjectID,
			statusFilter,
			fromDate,
			toDate,
			page,
			pageSize,
			sortBy,
			sortOrder,
		)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "Access denied") || strings.Contains(errMsg, "not assigned") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to search students",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    res,
		})
	}
}

// GetTeacherStudentAttendanceDetailHandler handles GET /api/teacher/students/:student_id/attendance
func GetTeacherStudentAttendanceDetailHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		studentID := strings.TrimSpace(c.Param("student_id"))
		if studentID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Student ID is required"})
			return
		}

		subjectIDParam := strings.TrimSpace(c.Query("subject_id"))
		statusParam := strings.TrimSpace(c.Query("status"))
		fromParam := strings.TrimSpace(c.Query("from"))
		toParam := strings.TrimSpace(c.Query("to"))

		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

		var subjectID *string
		if subjectIDParam != "" {
			subjectID = &subjectIDParam
		}

		var statusFilter *string
		if statusParam != "" {
			statusFilter = &statusParam
		}

		var fromDate *string
		var toDate *string
		const dateLayout = "2006-01-02"

		if fromParam != "" {
			fromT, err := time.Parse(dateLayout, fromParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'from' date format. Expected YYYY-MM-DD",
				})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
					})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{
						"success": false,
						"message": "'from' date cannot be after 'to' date",
					})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": "Invalid 'to' date format. Expected YYYY-MM-DD",
				})
				return
			}
			toDate = &toParam
		}

		detail, err := services.GetTeacherStudentAttendanceDetail(
			db,
			userID,
			studentID,
			subjectID,
			statusFilter,
			fromDate,
			toDate,
			page,
			limit,
		)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "Access denied") || strings.Contains(errMsg, "not authorized") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve student attendance details",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    detail,
		})
	}
}

// ==============================================================================
// MANUAL ATTENDANCE & CORRECTION HANDLERS (Feature #11)
// ==============================================================================

// MarkAttendanceManuallyHandler handles POST /api/teacher/attendance/manual
func MarkAttendanceManuallyHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		userRole := c.GetString("user_role")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		var req models.ManualAttendanceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request payload. Session ID, Student ID, Status (PRESENT/ABSENT), and Reason are required.",
			})
			return
		}

		resp, err := services.MarkAttendanceManually(db, userID, userRole, &req)
		if err != nil {
			errMsg := err.Error()

			if errors.Is(err, services.ErrReasonRequired) ||
				errors.Is(err, services.ErrReasonTooShort) ||
				errors.Is(err, services.ErrReasonTooLong) ||
				errors.Is(err, services.ErrInvalidAttendanceStatus) ||
				errors.Is(err, services.ErrStudentClassMismatch) ||
				errors.Is(err, services.ErrStudentNotAssignedClass) ||
				strings.Contains(errMsg, "Reason") ||
				strings.Contains(errMsg, "reason") ||
				strings.Contains(errMsg, "Invalid attendance status") ||
				strings.Contains(errMsg, "does not belong to the class") {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": errMsg})
				return
			}

			if errors.Is(err, services.ErrUnauthorizedTeacher) ||
				errors.Is(err, services.ErrStudentAccountInactive) ||
				strings.Contains(errMsg, "not authorized") ||
				strings.Contains(errMsg, "inactive") ||
				strings.Contains(errMsg, "Access denied") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}

			if errors.Is(err, services.ErrStudentNotFound) ||
				errors.Is(err, services.ErrSessionNotFound) ||
				strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}

			if strings.Contains(errMsg, "already marked") ||
				strings.Contains(errMsg, "modified by another user") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to mark attendance manually. Please try again.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Attendance marked successfully",
			"data":    resp,
		})
	}
}

// CorrectAttendanceHandler handles PATCH /api/teacher/attendance/:attendance_id/correct
func CorrectAttendanceHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		userRole := c.GetString("user_role")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		var req models.CorrectAttendanceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request payload. Status (PRESENT/ABSENT) and Reason are required.",
			})
			return
		}

		resp, err := services.CorrectAttendance(db, userID, userRole, attendanceID, &req)
		if err != nil {
			errMsg := err.Error()

			if errors.Is(err, services.ErrReasonRequired) ||
				errors.Is(err, services.ErrReasonTooShort) ||
				errors.Is(err, services.ErrReasonTooLong) ||
				errors.Is(err, services.ErrInvalidAttendanceStatus) ||
				errors.Is(err, services.ErrSameStatusCorrection) ||
				strings.Contains(errMsg, "Reason") ||
				strings.Contains(errMsg, "reason") ||
				strings.Contains(errMsg, "different from current status") ||
				strings.Contains(errMsg, "Invalid attendance status") {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": errMsg})
				return
			}

			if errors.Is(err, services.ErrUnauthorizedTeacher) ||
				strings.Contains(errMsg, "not authorized") ||
				strings.Contains(errMsg, "inactive") ||
				strings.Contains(errMsg, "Access denied") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}

			if errors.Is(err, services.ErrAttendanceNotFound) ||
				strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}

			if strings.Contains(errMsg, "modified by another user") || strings.Contains(errMsg, "conflict") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to correct attendance. Please try again.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Attendance corrected successfully",
			"data":    resp,
		})
	}
}

// GetAttendanceAuditHandler handles GET /api/teacher/attendance/:attendance_id/audit
func GetAttendanceAuditHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		userRole := c.GetString("user_role")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		auditHistory, err := services.GetAttendanceAuditHistory(db, userID, userRole, attendanceID)
		if err != nil {
			errMsg := err.Error()

			if errors.Is(err, services.ErrUnauthorizedTeacher) ||
				strings.Contains(errMsg, "not authorized") ||
				strings.Contains(errMsg, "Access denied") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}

			if errors.Is(err, services.ErrAttendanceNotFound) ||
				strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve attendance audit history",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    auditHistory,
		})
	}
}

// ==============================================================================
// LATE ATTENDANCE SETTINGS HANDLER (Feature #12)
// ==============================================================================

// UpdateSessionLateSettingsHandler handles PATCH /api/teacher/attendance/sessions/:id/late-settings
func UpdateSessionLateSettingsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		sessionID := strings.TrimSpace(c.Param("id"))
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Session ID is required"})
			return
		}

		var req models.UpdateLateSettingsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid request payload. Late threshold minutes (0-180) is required.",
			})
			return
		}

		if req.LateThresholdMinutes == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Late threshold minutes (0-180) is required.",
			})
			return
		}

		resp, err := services.UpdateSessionLateSettings(db, userID, sessionID, *req.LateThresholdMinutes)
		if err != nil {
			errMsg := err.Error()

			if strings.Contains(errMsg, "between 0 and 180") || strings.Contains(errMsg, "invalid") {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": errMsg})
				return
			}

			if strings.Contains(errMsg, "not authorized") || strings.Contains(errMsg, "Access denied") {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": errMsg})
				return
			}

			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update session late threshold: " + errMsg,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Late attendance threshold updated successfully",
			"data":    resp,
		})
	}
}


