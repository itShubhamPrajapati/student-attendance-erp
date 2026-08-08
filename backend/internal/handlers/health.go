package handlers

import (
	"net/http"

	"qr-attendance-backend/internal/database"

	"github.com/gin-gonic/gin"
)

// HealthResponse represents the health check API response
type HealthResponse struct {
	Status   string `json:"status"`
	Message  string `json:"message"`
	Database string `json:"database"`
}

// ErrorResponse represents a standardized JSON error response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// HealthCheckHandler handles GET /api/health
func HealthCheckHandler(c *gin.Context) {
	dbErr := database.CheckConnection()
	if dbErr != nil {
		c.JSON(http.StatusServiceUnavailable, HealthResponse{
			Status:   "error",
			Message:  "QR Attendance API is running with degraded service",
			Database: "disconnected",
		})
		return
	}

	c.JSON(http.StatusOK, HealthResponse{
		Status:   "ok",
		Message:  "QR Attendance API is running",
		Database: "connected",
	})
}
