package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// resolveFrontendBaseURL gets the current origin or configured frontend base URL for public verification links
func resolveFrontendBaseURL(c *gin.Context, cfg *config.Config) string {
	// 1. Check Origin / Referer header if present
	origin := c.GetHeader("Origin")
	if origin != "" {
		return strings.TrimRight(origin, "/")
	}
	referer := c.GetHeader("Referer")
	if referer != "" {
		// extract scheme + host
		parts := strings.Split(referer, "/")
		if len(parts) >= 3 {
			return parts[0] + "//" + parts[2]
		}
	}

	// 2. Default to Host or localhost:5173
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := c.Request.Host
	if host != "" {
		return fmt.Sprintf("%s://%s", scheme, host)
	}

	return "http://localhost:5173"
}

// GetStudentAttendanceProofHandler handles GET /api/student/attendance/:attendance_id/proof
func GetStudentAttendanceProofHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentUserID := c.GetString("user_id")
		if studentUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetStudentAttendanceProof(db, studentUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrUnauthorizedProofAccess) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			if errors.Is(err, services.ErrAttendanceNotFound) || errors.Is(err, services.ErrStudentProfileNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve attendance proof"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": proof})
	}
}

// DownloadStudentAttendanceProofPDFHandler handles GET /api/student/attendance/:attendance_id/proof/pdf
func DownloadStudentAttendanceProofPDFHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentUserID := c.GetString("user_id")
		if studentUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetStudentAttendanceProof(db, studentUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrUnauthorizedProofAccess) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			if errors.Is(err, services.ErrAttendanceNotFound) || errors.Is(err, services.ErrStudentProfileNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance proof"})
			return
		}

		pdfBytes, err := services.GenerateAttendanceProofPDF(proof)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to render attendance receipt PDF"})
			return
		}

		filename := fmt.Sprintf("attendance-receipt-%s.pdf", sanitizeFilename(proof.PublicID))
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// GetTeacherAttendanceProofHandler handles GET /api/teacher/attendance/:attendance_id/proof
func GetTeacherAttendanceProofHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		teacherUserID := c.GetString("user_id")
		if teacherUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetTeacherAttendanceProof(db, teacherUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrUnauthorizedProofAccess) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			if errors.Is(err, services.ErrAttendanceNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve attendance proof"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": proof})
	}
}

// DownloadTeacherAttendanceProofPDFHandler handles GET /api/teacher/attendance/:attendance_id/proof/pdf
func DownloadTeacherAttendanceProofPDFHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		teacherUserID := c.GetString("user_id")
		if teacherUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetTeacherAttendanceProof(db, teacherUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrUnauthorizedProofAccess) {
				c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
				return
			}
			if errors.Is(err, services.ErrAttendanceNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance proof"})
			return
		}

		pdfBytes, err := services.GenerateAttendanceProofPDF(proof)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to render attendance receipt PDF"})
			return
		}

		filename := fmt.Sprintf("attendance-receipt-%s.pdf", sanitizeFilename(proof.PublicID))
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// GetAdminAttendanceProofHandler handles GET /api/admin/attendance/:attendance_id/proof
func GetAdminAttendanceProofHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminUserID := c.GetString("user_id")
		if adminUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetAdminAttendanceProof(db, adminUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrAttendanceNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to retrieve attendance proof"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"success": true, "data": proof})
	}
}

// DownloadAdminAttendanceProofPDFHandler handles GET /api/admin/attendance/:attendance_id/proof/pdf
func DownloadAdminAttendanceProofPDFHandler(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		adminUserID := c.GetString("user_id")
		if adminUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authentication required"})
			return
		}

		attendanceID := strings.TrimSpace(c.Param("attendance_id"))
		if attendanceID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Attendance ID is required"})
			return
		}

		baseURL := resolveFrontendBaseURL(c, cfg)
		proof, err := services.GetAdminAttendanceProof(db, adminUserID, attendanceID, baseURL)
		if err != nil {
			if errors.Is(err, services.ErrAttendanceNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate attendance proof"})
			return
		}

		pdfBytes, err := services.GenerateAttendanceProofPDF(proof)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to render attendance receipt PDF"})
			return
		}

		filename := fmt.Sprintf("attendance-receipt-%s.pdf", sanitizeFilename(proof.PublicID))
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
	}
}

// VerifyAttendanceProofPublicHandler handles unauthenticated GET /api/attendance/proof/verify/:public_id
func VerifyAttendanceProofPublicHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		publicID := strings.TrimSpace(c.Param("public_id"))
		if publicID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Proof identifier is required.",
				"data": gin.H{
					"valid":               false,
					"verification_status": "INVALID",
				},
			})
			return
		}

		verification, err := services.VerifyAttendanceProof(db, publicID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to process verification inquiry.",
				"data": gin.H{
					"valid":               false,
					"verification_status": "INVALID",
				},
			})
			return
		}

		if !verification.Valid {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": verification.Message,
				"data":    verification,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": verification.Message,
			"data":    verification,
		})
	}
}
