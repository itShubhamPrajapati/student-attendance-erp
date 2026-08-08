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
				"version":     "3.0.0 (Phase 3 Academic Structure & Class Management)",
				"environment": cfg.Environment,
			})
		})

		// Authentication Routes (Public & Session Check)
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/login", handlers.LoginHandler(cfg, database.DB))
			authGroup.GET("/me", middleware.RequireAuth(cfg.JWTSecret), handlers.GetMeHandler(database.DB))
		}

		// ==============================================================================
		// ADMIN ROUTES (Protected: RequireAuth + RequireRole("ADMIN"))
		// ==============================================================================
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
			adminGroup.PATCH("/students/:id/class", handlers.AssignStudentClassHandler(database.DB))

			// Teacher Management
			adminGroup.GET("/teachers", handlers.GetTeachersHandler(database.DB))
			adminGroup.POST("/teachers", handlers.CreateTeacherHandler(database.DB))
			adminGroup.PUT("/teachers/:id", handlers.UpdateTeacherHandler(database.DB))
			adminGroup.PATCH("/teachers/:id/status", handlers.ToggleTeacherStatusHandler(database.DB))

			// Subject Management (Phase 3)
			adminGroup.GET("/subjects", handlers.GetSubjectsHandler(database.DB))
			adminGroup.POST("/subjects", handlers.CreateSubjectHandler(database.DB))
			adminGroup.PUT("/subjects/:id", handlers.UpdateSubjectHandler(database.DB))
			adminGroup.DELETE("/subjects/:id", handlers.DeleteSubjectHandler(database.DB))

			// Class Management (Phase 3)
			adminGroup.GET("/classes", handlers.GetClassesHandler(database.DB))
			adminGroup.POST("/classes", handlers.CreateClassHandler(database.DB))
			adminGroup.PUT("/classes/:id", handlers.UpdateClassHandler(database.DB))
			adminGroup.DELETE("/classes/:id", handlers.DeleteClassHandler(database.DB))

			// Teaching Assignments Management (Phase 3)
			adminGroup.GET("/assignments", handlers.GetAssignmentsHandler(database.DB))
			adminGroup.POST("/assignments", handlers.CreateAssignmentHandler(database.DB))
			adminGroup.DELETE("/assignments/:id", handlers.DeleteAssignmentHandler(database.DB))
		}

		// ==============================================================================
		// TEACHER PORTAL ROUTES (Protected: RequireAuth + RequireRole("TEACHER"))
		// ==============================================================================
		teacherGroup := api.Group("/teacher")
		teacherGroup.Use(middleware.RequireAuth(cfg.JWTSecret))
		teacherGroup.Use(middleware.RequireRole(models.RoleTeacher))
		{
			teacherGroup.GET("/profile", handlers.GetTeacherProfileHandler(database.DB))
			teacherGroup.GET("/assignments", handlers.GetTeacherAssignmentsHandler(database.DB))
		}

		// ==============================================================================
		// STUDENT PORTAL ROUTES (Protected: RequireAuth + RequireRole("STUDENT"))
		// ==============================================================================
		studentGroup := api.Group("/student")
		studentGroup.Use(middleware.RequireAuth(cfg.JWTSecret))
		studentGroup.Use(middleware.RequireRole(models.RoleStudent))
		{
			studentGroup.GET("/profile", handlers.GetStudentProfileHandler(database.DB))
			studentGroup.GET("/subjects", handlers.GetStudentSubjectsHandler(database.DB))
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
