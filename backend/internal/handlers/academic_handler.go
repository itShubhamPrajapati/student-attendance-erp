package handlers

import (
	"net/http"
	"strings"

	"qr-attendance-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==============================================================================
// SUBJECT HANDLERS (Admin Only)
// ==============================================================================

// GetSubjectsHandler handles GET /api/admin/subjects
func GetSubjectsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		subjects, err := services.GetSubjects(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve subjects directory",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    subjects,
		})
	}
}

// CreateSubjectHandler handles POST /api/admin/subjects
func CreateSubjectHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input services.CreateSubjectInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid subject name, code, department, and semester (1-12)",
			})
			return
		}

		subject, err := services.CreateSubject(db, &input)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create subject",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Subject created successfully",
			"data":    subject,
		})
	}
}

// UpdateSubjectHandler handles PUT /api/admin/subjects/:id
func UpdateSubjectHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Subject ID is required"})
			return
		}

		var input services.UpdateSubjectInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid subject details",
			})
			return
		}

		if err := services.UpdateSubject(db, id, &input); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update subject"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Subject updated successfully",
		})
	}
}

// DeleteSubjectHandler handles DELETE /api/admin/subjects/:id
func DeleteSubjectHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Subject ID is required"})
			return
		}

		if err := services.DeleteSubject(db, id); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "Cannot delete subject") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete subject"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Subject deleted successfully",
		})
	}
}

// ==============================================================================
// CLASS HANDLERS (Admin Only)
// ==============================================================================

// GetClassesHandler handles GET /api/admin/classes
func GetClassesHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		classes, err := services.GetClasses(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve classes directory",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    classes,
		})
	}
}

// CreateClassHandler handles POST /api/admin/classes
func CreateClassHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input services.CreateClassInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid class name, department, semester (1-12), section, and academic year",
			})
			return
		}

		class, err := services.CreateClass(db, &input)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create class",
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Class created successfully",
			"data":    class,
		})
	}
}

// UpdateClassHandler handles PUT /api/admin/classes/:id
func UpdateClassHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Class ID is required"})
			return
		}

		var input services.UpdateClassInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please provide valid class details",
			})
			return
		}

		if err := services.UpdateClass(db, id, &input); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update class"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Class updated successfully",
		})
	}
}

// DeleteClassHandler handles DELETE /api/admin/classes/:id
func DeleteClassHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Class ID is required"})
			return
		}

		if err := services.DeleteClass(db, id); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "Cannot delete class") {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"message": errMsg,
				})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete class"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Class deleted successfully",
		})
	}
}

// ==============================================================================
// STUDENT CLASS ASSIGNMENT HANDLER (Admin Only)
// ==============================================================================

// AssignStudentClassHandler handles PATCH /api/admin/students/:id/class
func AssignStudentClassHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("id")
		if studentID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Student ID is required"})
			return
		}

		var input services.AssignStudentClassInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid class assignment payload"})
			return
		}

		if err := services.AssignStudentClass(db, studentID, input.ClassID); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update student class assignment"})
			return
		}

		msg := "Student assigned to class successfully"
		if input.ClassID == nil || strings.TrimSpace(*input.ClassID) == "" {
			msg = "Student removed from class successfully"
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": msg,
		})
	}
}

// ==============================================================================
// TEACHING ASSIGNMENT HANDLERS (Admin Only)
// ==============================================================================

// GetAssignmentsHandler handles GET /api/admin/assignments
func GetAssignmentsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		assignments, err := services.GetAssignments(db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve teaching assignments",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    assignments,
		})
	}
}

// CreateAssignmentHandler handles POST /api/admin/assignments
func CreateAssignmentHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input services.CreateAssignmentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Please select a teacher, subject, and class",
			})
			return
		}

		assignment, err := services.CreateAssignment(db, &input)
		if err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "already exists") {
				c.JSON(http.StatusConflict, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			if strings.Contains(errMsg, "inactive teacher") {
				c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create teaching assignment"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"message": "Teaching assignment created successfully",
			"data":    assignment,
		})
	}
}

// DeleteAssignmentHandler handles DELETE /api/admin/assignments/:id
func DeleteAssignmentHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Assignment ID is required"})
			return
		}

		if err := services.DeleteAssignment(db, id); err != nil {
			errMsg := err.Error()
			if strings.Contains(errMsg, "not found") {
				c.JSON(http.StatusNotFound, gin.H{"success": false, "message": errMsg})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to remove assignment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Teaching assignment removed successfully",
		})
	}
}

// ==============================================================================
// TEACHER PORTAL HANDLERS (RequireRole: TEACHER)
// ==============================================================================

// GetTeacherProfileHandler handles GET /api/teacher/profile
func GetTeacherProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		profile, err := services.GetTeacherProfileByUserID(db, userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Teacher profile not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"profile": profile,
		})
	}
}

// GetTeacherAssignmentsHandler handles GET /api/teacher/assignments
func GetTeacherAssignmentsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		assignments, err := services.GetTeacherAssignmentsByUserID(db, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve assigned classes and subjects",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    assignments,
		})
	}
}

// ==============================================================================
// STUDENT PORTAL HANDLERS (RequireRole: STUDENT)
// ==============================================================================

// GetStudentProfileHandler handles GET /api/student/profile
func GetStudentProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		profile, err := services.GetStudentProfileByUserID(db, userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Student profile not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"student": profile,
		})
	}
}

// GetStudentSubjectsHandler handles GET /api/student/subjects
func GetStudentSubjectsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		subjects, err := services.GetStudentSubjectsByUserID(db, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to retrieve class subjects",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    subjects,
		})
	}
}
