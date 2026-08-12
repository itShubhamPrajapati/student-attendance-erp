package handlers

import (
	"net/http"

	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetTeacherProfileHandler handles GET /api/teacher/profile
func GetTeacherProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		profile, err := services.GetTeacherFullProfile(db, userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Teacher profile not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    profile,
			"profile": profile.Teacher,
			"teacher": profile.Teacher,
		})
	}
}

// UpdateTeacherProfileHandler handles PATCH /api/teacher/profile
func UpdateTeacherProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		var req models.TeacherProfileUpdateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid profile update payload",
			})
			return
		}

		profile, err := services.UpdateTeacherProfile(db, userID, req)
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
			"profile": profile.Teacher,
			"teacher": profile.Teacher,
		})
	}
}

// ChangeTeacherPasswordHandler handles PATCH /api/teacher/account/password
func ChangeTeacherPasswordHandler(db *gorm.DB) gin.HandlerFunc {
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

		if err := services.ChangeTeacherPassword(db, userID, req); err != nil {
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
