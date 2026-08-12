package handlers

import (
	"errors"
	"net/http"

	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetRecentActivityHandler handles GET /api/activity/recent
func GetRecentActivityHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			return
		}

		role := c.GetString("role")

		var req models.RecentActivityRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid query parameters.",
			})
			return
		}

		response, err := services.GetRecentActivity(db, userID, role, req)
		if err != nil {
			if errors.Is(err, services.ErrInvalidActivityLimit) || errors.Is(err, services.ErrInvalidDateRange) {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve recent activity.",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    response,
		})
	}
}
