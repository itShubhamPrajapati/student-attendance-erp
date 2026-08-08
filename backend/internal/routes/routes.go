package routes

import (
	"net/http"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/database"
	"qr-attendance-backend/internal/handlers"
	"qr-attendance-backend/internal/middleware"
	"qr-attendance-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes Gin routes, authentication, and role authorization middlewares
func SetupRouter(cfg *config.Config) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.New()

	// Logger and Recovery
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Development CORS configuration
	router.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// API Group
	api := router.Group("/api")
	{
		// Health & System Info (Public)
		api.GET("/health", handlers.HealthCheckHandler)
		api.GET("/info", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"name":        "QR-Based Student Attendance Management System API",
				"version":     "2.0.0 (Phase 2 Auth & User Management)",
				"environment": cfg.Environment,
			})
		})

		// Authentication Routes (Public & Session Check)
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", handlers.LoginHandler(cfg, database.DB))
			authGroup.GET("/me", middleware.RequireAuth(cfg.JWTSecret), handlers.GetMeHandler(database.DB))
		}

		// Admin Management Routes (Protected: RequireAuth + RequireRole("ADMIN"))
		adminGroup := api.Group("/admin")
		adminGroup.Use(middleware.RequireAuth(cfg.JWTSecret))
		adminGroup.Use(middleware.RequireRole(models.RoleAdmin))
		{
			adminGroup.GET("/dashboard", handlers.AdminDashboardHandler(database.DB))

			// Student Management
			adminGroup.GET("/students", handlers.GetStudentsHandler(database.DB))
			adminGroup.POST("/students", handlers.CreateStudentHandler(database.DB))
			adminGroup.PUT("/students/:id", handlers.UpdateStudentHandler(database.DB))
			adminGroup.PATCH("/students/:id/status", handlers.ToggleStudentStatusHandler(database.DB))

			// Teacher Management
			adminGroup.GET("/teachers", handlers.GetTeachersHandler(database.DB))
			adminGroup.POST("/teachers", handlers.CreateTeacherHandler(database.DB))
			adminGroup.PUT("/teachers/:id", handlers.UpdateTeacherHandler(database.DB))
			adminGroup.PATCH("/teachers/:id/status", handlers.ToggleTeacherStatusHandler(database.DB))
		}
	}

	// Fallback 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "API route not found",
		})
	})

	return router
}
