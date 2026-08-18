package handlers

import (
	"net/http"

	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetStudentProfileHandler handles GET /api/student/profile
func GetStudentProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		profile, err := services.GetStudentProfile(db, userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Student profile not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    profile,
			"student": profile,
		})
	}
}

// UpdateStudentProfileHandler handles PATCH /api/student/profile
func UpdateStudentProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		var req models.StudentProfileUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid profile update payload",
			})
			return
		}

		profile, err := services.UpdateStudentProfile(db, userID, req)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Profile updated successfully",
			"data":    profile,
			"student": profile,
		})
	}
}

// ChangeStudentPasswordHandler handles PATCH /api/student/account/password
func ChangeStudentPasswordHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		var req models.ChangePasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Current password and a valid new password (min 6 characters) are required",
			})
			return
		}

		if err := services.ChangeStudentPassword(db, userID, req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Password updated successfully",
		})
	}
}
