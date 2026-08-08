package routes

import (
	"net/http"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/handlers"
	"qr-attendance-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes Gin routes and middlewares
func SetupRouter(cfg *config.Config) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	// Essential logger and recovery middlewares
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Development CORS configuration
	router.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// API Group
	api := router.Group("/api")
	{
		// Health Check Endpoint (Phase 1 Foundation Requirement)
		api.GET("/health", handlers.HealthCheckHandler)

		// Base Information Endpoint
		api.GET("/info", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"name":        "QR-Based Student Attendance Management System API",
				"version":     "1.0.0 (Phase 1 Foundation)",
				"environment": cfg.Environment,
			})
		})

		// Architecture-ready route placeholders for Phase 2
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", func(c *gin.Context) {
				c.JSON(http.StatusNotImplemented, gin.H{
					"success": false,
					"message": "Authentication endpoint is scheduled for Phase 2 implementation",
				})
			})
		}
	}

	// Fallback 404 handler with clean JSON structure
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "API route not found",
		})
	})

	return router
}
