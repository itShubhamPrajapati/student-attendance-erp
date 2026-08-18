package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// parseExportParams extracts and validates export query parameters
func parseExportParams(c *gin.Context) (services.AttendanceExportParams, error) {
	query := strings.TrimSpace(c.Query("q"))
	classIDParam := strings.TrimSpace(c.Query("class_id"))
	subjectIDParam := strings.TrimSpace(c.Query("subject_id"))
	statusParam := strings.TrimSpace(c.Query("status"))
	fromParam := strings.TrimSpace(c.Query("from"))
	toParam := strings.TrimSpace(c.Query("to"))
	studentIDParam := strings.TrimSpace(c.Query("student_id"))

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

	var studentID *string
	if studentIDParam != "" {
		studentID = &studentIDParam
	}

	var fromDate *string
	var toDate *string
	const dateLayout = "2006-01-02"

	if fromParam != "" {
		fromT, err := time.Parse(dateLayout, fromParam)
		if err != nil {
			return services.AttendanceExportParams{}, errors.New("Invalid 'from' date format. Expected YYYY-MM-DD")
		}
		fromDate = &fromParam

		if toParam != "" {
			toT, err := time.Parse(dateLayout, toParam)
			if err != nil {
				return services.AttendanceExportParams{}, errors.New("Invalid 'to' date format. Expected YYYY-MM-DD")
			}
			if fromT.After(toT) {
				return services.AttendanceExportParams{}, errors.New("'from' date cannot be after 'to' date")
			}
			toDate = &toParam
		}
	} else if toParam != "" {
		_, err := time.Parse(dateLayout, toParam)
		if err != nil {
			return services.AttendanceExportParams{}, errors.New("Invalid 'to' date format. Expected YYYY-MM-DD")
		}
		toDate = &toParam
	}

	return services.AttendanceExportParams{
		Query:     query,
		ClassID:   classID,
		SubjectID: subjectID,
		Status:    statusFilter,
		FromDate:  fromDate,
		ToDate:    toDate,
		StudentID: studentID,
	}, nil
}

// ==============================================================================
// TEACHER MASTER ATTENDANCE EXPORTS (CSV, EXCEL, PDF)
// ==============================================================================

// ExportTeacherAttendanceCSVHandler handles GET /api/teacher/attendance/export/csv
func ExportTeacherAttendanceCSVHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		params, err := parseExportParams(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}

		data, err := services.GetTeacherAttendanceExportData(db, userID, params)
		if err != nil {
			if errors.Is(err, services.ErrExportNoData) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "No attendance records found for the selected filters."})
				return
			}
			if errors.Is(err, services.ErrExportUnauthorized) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance export data."})
			return
		}

		filename := fmt.Sprintf("attendance-report-%s.csv", time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

		if err := services.GenerateAttendanceCSV(c.Writer, data); err != nil {
			// streaming already started, log error
			return
		}
	}
}

// ExportTeacherAttendanceExcelHandler handles GET /api/teacher/attendance/export/excel
func ExportTeacherAttendanceExcelHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		params, err := parseExportParams(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}

		data, err := services.GetTeacherAttendanceExportData(db, userID, params)
		if err != nil {
			if errors.Is(err, services.ErrExportNoData) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "No attendance records found for the selected filters."})
				return
			}
			if errors.Is(err, services.ErrExportUnauthorized) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance export data."})
			return
		}

		xlsxBytes, err := services.GenerateAttendanceExcel(data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate Excel report."})
			return
		}

		filename := fmt.Sprintf("attendance-report-%s.xlsx", time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsxBytes)
	}
}

// ExportTeacherAttendancePDFHandler handles GET /api/teacher/attendance/export/pdf
func ExportTeacherAttendancePDFHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		params, err := parseExportParams(c)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}

		data, err := services.GetTeacherAttendanceExportData(db, userID, params)
		if err != nil {
			if errors.Is(err, services.ErrExportNoData) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "No attendance records found for the selected filters."})
				return
			}
			if errors.Is(err, services.ErrExportUnauthorized) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance export data."})
			return
		}

		pdfBytes, err := services.GenerateAttendancePDF(data)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate PDF report."})
			return
		}

		filename := fmt.Sprintf("attendance-report-%s.pdf", time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// ==============================================================================
// TEACHER STUDENT DETAIL ATTENDANCE EXPORTS (CSV, EXCEL, PDF)
// ==============================================================================

// ExportTeacherStudentAttendanceCSVHandler handles GET /api/teacher/students/:student_id/attendance/export/csv
func ExportTeacherStudentAttendanceCSVHandler(db *gorm.DB) gin.HandlerFunc {
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
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'from' date format. Expected YYYY-MM-DD"})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "'from' date cannot be after 'to' date"})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
				return
			}
			toDate = &toParam
		}

		// Fetch complete student history records without pagination limits for export (page 1, limit 10000)
		detail, err := services.GetTeacherStudentAttendanceDetail(
			db,
			userID,
			studentID,
			subjectID,
			statusFilter,
			fromDate,
			toDate,
			1,
			10000,
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
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve student attendance details"})
			return
		}

		filename := fmt.Sprintf("student-attendance-%s-%s.csv", sanitizeFilename(detail.Student.RollNumber), time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")

		_ = services.GenerateStudentDetailCSV(c.Writer, detail)
	}
}

// ExportTeacherStudentAttendanceExcelHandler handles GET /api/teacher/students/:student_id/attendance/export/excel
func ExportTeacherStudentAttendanceExcelHandler(db *gorm.DB) gin.HandlerFunc {
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
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'from' date format. Expected YYYY-MM-DD"})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "'from' date cannot be after 'to' date"})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
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
			1,
			10000,
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
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve student attendance details"})
			return
		}

		xlsxBytes, err := services.GenerateStudentDetailExcel(detail)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate Excel report"})
			return
		}

		filename := fmt.Sprintf("student-attendance-%s-%s.xlsx", sanitizeFilename(detail.Student.RollNumber), time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsxBytes)
	}
}

// ExportTeacherStudentAttendancePDFHandler handles GET /api/teacher/students/:student_id/attendance/export/pdf
func ExportTeacherStudentAttendancePDFHandler(db *gorm.DB) gin.HandlerFunc {
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
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'from' date format. Expected YYYY-MM-DD"})
				return
			}
			fromDate = &fromParam

			if toParam != "" {
				toT, err := time.Parse(dateLayout, toParam)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
					return
				}
				if fromT.After(toT) {
					c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "'from' date cannot be after 'to' date"})
					return
				}
				toDate = &toParam
			}
		} else if toParam != "" {
			_, err := time.Parse(dateLayout, toParam)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid 'to' date format. Expected YYYY-MM-DD"})
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
			1,
			10000,
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
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve student attendance details"})
			return
		}

		pdfBytes, err := services.GenerateStudentDetailPDF(detail)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate PDF report"})
			return
		}

		filename := fmt.Sprintf("student-attendance-%s-%s.pdf", sanitizeFilename(detail.Student.RollNumber), time.Now().UTC().Format("2006-01-02"))
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// sanitizeFilename removes unsafe characters for HTTP download headers
func sanitizeFilename(name string) string {
	clean := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, name)
	if clean == "" {
		return "report"
	}
	return clean
}
