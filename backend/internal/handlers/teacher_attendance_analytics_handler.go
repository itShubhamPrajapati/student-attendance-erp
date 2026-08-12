package handlers

import (
	"errors"
	"net/http"

	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetTeacherAttendanceAnalyticsHandler handles GET /api/teacher/attendance/analytics
func GetTeacherAttendanceAnalyticsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		teacherUserID := c.GetString("user_id")
		if teacherUserID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		var req models.TeacherAttendanceAnalyticsRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid query parameters.",
			})
			return
		}

		analytics, err := services.GetTeacherAttendanceAnalytics(db, teacherUserID, req)
		if err != nil {
			if errors.Is(err, services.ErrTeacherNotFound) {
				c.JSON(http.StatusNotFound, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
			if errors.Is(err, services.ErrUnauthorizedClassAccess) || errors.Is(err, services.ErrUnauthorizedSubjectAccess) {
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
			if errors.Is(err, services.ErrInvalidDateRange) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to compute teacher attendance analytics.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    analytics,
		})
	}
}
