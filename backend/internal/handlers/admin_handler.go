package handlers

import (
	"net/http"
	"strings"

	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminDashboardHandler handles GET /api/admin/dashboard
func AdminDashboardHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := services.GetDashboardStats(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to compute dashboard metrics",
			})
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}

// GetStudentsHandler handles GET /api/admin/students
func GetStudentsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		students, err := services.GetStudents(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve student directory",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    students,
		})
	}
}

// CreateStudentHandler handles POST /api/admin/students with transaction safety
func CreateStudentHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input services.CreateStudentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please fill out all required student fields correctly",
			})
			return
		}

		student, err := services.CreateStudentTx(db, &input)
		if err != nil {
			// Handle duplicate conflicts
			errMsg := err.Error()
			if strings.Contains(errMsg, "Email is already registered") || strings.Contains(errMsg, "Roll number already exists") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create student account: " + errMsg,
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Student created successfully",
			"data":    student,
		})
	}
}

// UpdateStudentHandler handles PUT /api/admin/students/:id
func UpdateStudentHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("id")
		if studentID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Student ID is required"})
			return
		}

		var input services.UpdateStudentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid update data",
			})
			return
		}

		if err := services.UpdateStudent(db, studentID, &input); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already registered") || strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update student"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Student updated successfully",
		})
	}
}

// ToggleStudentStatusHandler handles PATCH /api/admin/students/:id/status
func ToggleStudentStatusHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("id")
		var input services.StatusToggleInput
		if err := c.ShouldBindJSON(&input); err != nil || input.IsActive == nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "is_active boolean field is required"})
			return
		}

		if err := services.ToggleStudentStatus(db, studentID, *input.IsActive); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}

		statusLabel := "deactivated"
		if *input.IsActive {
			statusLabel = "activated"
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Student account " + statusLabel + " successfully",
		})
	}
}

// GetTeachersHandler handles GET /api/admin/teachers
func GetTeachersHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		teachers, err := services.GetTeachers(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve teacher directory",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    teachers,
		})
	}
}

// CreateTeacherHandler handles POST /api/admin/teachers with transaction safety
func CreateTeacherHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input services.CreateTeacherInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please fill out all required teacher fields correctly",
			})
			return
		}

		teacher, err := services.CreateTeacherTx(db, &input)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "Email is already registered") || strings.Contains(errMsg, "Employee ID already exists") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create teacher account: " + errMsg,
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Teacher created successfully",
			"data":    teacher,
		})
	}
}

// UpdateTeacherHandler handles PUT /api/admin/teachers/:id
func UpdateTeacherHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		teacherID := c.Param("id")
		if teacherID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Teacher ID is required"})
			return
		}

		var input services.UpdateTeacherInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid update data",
			})
			return
		}

		if err := services.UpdateTeacher(db, teacherID, &input); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already registered") || strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update teacher"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Teacher updated successfully",
		})
	}
}

// ToggleTeacherStatusHandler handles PATCH /api/admin/teachers/:id/status
func ToggleTeacherStatusHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		teacherID := c.Param("id")
		var input services.StatusToggleInput
		if err := c.ShouldBindJSON(&input); err != nil || input.IsActive == nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "is_active boolean field is required"})
			return
		}

		if err := services.ToggleTeacherStatus(db, teacherID, *input.IsActive); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}

		statusLabel := "deactivated"
		if *input.IsActive {
			statusLabel = "activated"
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Teacher account " + statusLabel + " successfully",
		})
	}
}
