package handlers

import (
	"net/http"
	"strings"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LoginInput defines login request payload
type LoginInput struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginHandler handles POST /api/auth/login
func LoginHandler(cfg *config.Config, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input LoginInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide both email and password",
			})
			return
		}

		cleanEmail := strings.ToLower(strings.TrimSpace(input.Email))

		var user models.User
		if err := db.Where("LOWER(email) = ?", cleanEmail).First(&user).Error; err != nil {
			// Generic message to prevent account enumeration
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid email or password",
			})
			return
		}

		// Verify password hash
		if !services.CheckPassword(user.PasswordHash, input.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid email or password",
			})
			return
		}

		// Verify active account
		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Account is inactive",
			})
			return
		}

		// Generate JWT Token
		token, err := services.GenerateJWT(&user, cfg.JWTSecret, cfg.JWTExpHours)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to generate authentication session",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Login successful",
			"token":   token,
			"user": models.UserSafeResponse{
				ID:       user.ID,
				Name:     user.Name,
				Email:    user.Email,
				Role:     user.Role,
				IsActive: user.IsActive,
			},
		})
	}
}

// GetMeHandler handles GET /api/auth/me for authenticated user profile restoration
func GetMeHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		userID := userIDVal.(string)

		var user models.User
		if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Account is inactive",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"user": models.UserSafeResponse{
				ID:       user.ID,
				Name:     user.Name,
				Email:    user.Email,
				Role:     user.Role,
				IsActive: user.IsActive,
			},
		})
	}
}
