package services

import (
	"errors"
	"fmt"
	"strings"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

// CreateStudentInput validates payload for student creation
type CreateStudentInput struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	RollNumber string `json:"roll_number" binding:"required"`
	Department string `json:"department" binding:"required"`
	Semester   int    `json:"semester" binding:"required,min=1,max=12"`
	Section    string `json:"section" binding:"required"`
}

// UpdateStudentInput validates payload for student editing
type UpdateStudentInput struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	RollNumber string `json:"roll_number" binding:"required"`
	Department string `json:"department" binding:"required"`
	Semester   int    `json:"semester" binding:"required,min=1,max=12"`
	Section    string `json:"section" binding:"required"`
}

// CreateTeacherInput validates payload for teacher creation
type CreateTeacherInput struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	EmployeeID string `json:"employee_id" binding:"required"`
	Department string `json:"department" binding:"required"`
}

// UpdateTeacherInput validates payload for teacher editing
type UpdateTeacherInput struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	EmployeeID string `json:"employee_id" binding:"required"`
	Department string `json:"department" binding:"required"`
}

// StatusToggleInput for deactivating/activating accounts
type StatusToggleInput struct {
	IsActive *bool `json:"is_active" binding:"required"`
}

// CreateStudentTx creates a student and associated user account within a database transaction
func CreateStudentTx(db *gorm.DB, input *CreateStudentInput) (*models.StudentResponse, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(input.Email))
	cleanRoll := strings.TrimSpace(input.RollNumber)

	// 1. Check duplicate email in users
	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ?", cleanEmail).Count(&count)
	if count > 0 {
		return nil, errors.New("Email is already registered.")
	}

	// 2. Check duplicate roll number in students
	db.Model(&models.Student{}).Where("roll_number = ?", cleanRoll).Count(&count)
	if count > 0 {
		return nil, errors.New("Roll number already exists.")
	}

	// 3. Hash password
	passwordHash, err := HashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to process password: %w", err)
	}

	var createdStudent models.StudentResponse

	// 4. Execute atomic transaction (Users INSERT + Students INSERT)
	txErr := db.Transaction(func(tx *gorm.DB) error {
		user := models.User{
			Name:         strings.TrimSpace(input.Name),
			Email:        cleanEmail,
			PasswordHash: passwordHash,
			Role:         models.RoleStudent,
			IsActive:     true,
		}

		if err := tx.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create user account: %w", err)
		}

		student := models.Student{
			UserID:     user.ID,
			RollNumber: cleanRoll,
			Department: strings.TrimSpace(input.Department),
			Semester:   input.Semester,
			Section:    strings.TrimSpace(input.Section),
		}

		if err := tx.Create(&student).Error; err != nil {
			return fmt.Errorf("failed to create student profile: %w", err)
		}

		createdStudent = models.StudentResponse{
			ID:         student.ID,
			UserID:     user.ID,
			Name:       user.Name,
			Email:      user.Email,
			RollNumber: student.RollNumber,
			Department: student.Department,
			Semester:   student.Semester,
			Section:    student.Section,
			IsActive:   user.IsActive,
			CreatedAt:  student.CreatedAt,
		}

		return nil
	})

	if txErr != nil {
		return nil, txErr
	}

	return &createdStudent, nil
}

// GetStudents retrieves all students with user profiles
func GetStudents(db *gorm.DB) ([]models.StudentResponse, error) {
	var results []models.StudentResponse

	query := `
		SELECT 
			s.id, s.user_id, u.name, u.email, s.roll_number, 
			s.department, s.semester, s.section, u.is_active, s.created_at
		FROM students s
		JOIN users u ON s.user_id = u.id
		ORDER BY s.created_at DESC
	`

	if err := db.Raw(query).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to query students: %w", err)
	}

	if results == nil {
		results = []models.StudentResponse{}
	}

	return results, nil
}

// UpdateStudent updates student profile details and user name/email
func UpdateStudent(db *gorm.DB, studentID string, input *UpdateStudentInput) error {
	cleanEmail := strings.ToLower(strings.TrimSpace(input.Email))
	cleanRoll := strings.TrimSpace(input.RollNumber)

	var student models.Student
	if err := db.Where("id = ?", studentID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Student not found")
		}
		return err
	}

	// Check email collision
	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ? AND id <> ?", cleanEmail, student.UserID).Count(&count)
	if count > 0 {
		return errors.New("Email is already registered by another account.")
	}

	// Check roll number collision
	db.Model(&models.Student{}).Where("roll_number = ? AND id <> ?", cleanRoll, studentID).Count(&count)
	if count > 0 {
		return errors.New("Roll number already exists.")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", student.UserID).Updates(map[string]interface{}{
			"name":  strings.TrimSpace(input.Name),
			"email": cleanEmail,
		}).Error; err != nil {
			return err
		}

		return tx.Model(&student).Updates(map[string]interface{}{
			"roll_number": cleanRoll,
			"department":  strings.TrimSpace(input.Department),
			"semester":    input.Semester,
			"section":     strings.TrimSpace(input.Section),
		}).Error
	})
}

// ToggleStudentStatus deactivates or activates a student's user account
func ToggleStudentStatus(db *gorm.DB, studentID string, isActive bool) error {
	var student models.Student
	if err := db.Where("id = ?", studentID).First(&student).Error; err != nil {
		return errors.New("Student not found")
	}

	return db.Model(&models.User{}).Where("id = ?", student.UserID).Update("is_active", isActive).Error
}

// CreateTeacherTx creates a teacher and associated user account within a database transaction
func CreateTeacherTx(db *gorm.DB, input *CreateTeacherInput) (*models.TeacherResponse, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(input.Email))
	cleanEmpID := strings.TrimSpace(input.EmployeeID)

	// 1. Check duplicate email
	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ?", cleanEmail).Count(&count)
	if count > 0 {
		return nil, errors.New("Email is already registered.")
	}

	// 2. Check duplicate employee ID
	db.Model(&models.Teacher{}).Where("employee_id = ?", cleanEmpID).Count(&count)
	if count > 0 {
		return nil, errors.New("Employee ID already exists.")
	}

	// 3. Hash password
	passwordHash, err := HashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to process password: %w", err)
	}

	var createdTeacher models.TeacherResponse

	// 4. Atomic Transaction (Users INSERT + Teachers INSERT)
	txErr := db.Transaction(func(tx *gorm.DB) error {
		user := models.User{
			Name:         strings.TrimSpace(input.Name),
			Email:        cleanEmail,
			PasswordHash: passwordHash,
			Role:         models.RoleTeacher,
			IsActive:     true,
		}

		if err := tx.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create teacher account: %w", err)
		}

		teacher := models.Teacher{
			UserID:     user.ID,
			EmployeeID: cleanEmpID,
			Department: strings.TrimSpace(input.Department),
		}

		if err := tx.Create(&teacher).Error; err != nil {
			return fmt.Errorf("failed to create teacher profile: %w", err)
		}

		createdTeacher = models.TeacherResponse{
			ID:         teacher.ID,
			UserID:     user.ID,
			Name:       user.Name,
			Email:      user.Email,
			EmployeeID: teacher.EmployeeID,
			Department: teacher.Department,
			IsActive:   user.IsActive,
			CreatedAt:  teacher.CreatedAt,
		}

		return nil
	})

	if txErr != nil {
		return nil, txErr
	}

	return &createdTeacher, nil
}

// GetTeachers retrieves all teachers with user profiles
func GetTeachers(db *gorm.DB) ([]models.TeacherResponse, error) {
	var results []models.TeacherResponse

	query := `
		SELECT 
			t.id, t.user_id, u.name, u.email, t.employee_id, 
			t.department, u.is_active, t.created_at
		FROM teachers t
		JOIN users u ON t.user_id = u.id
		ORDER BY t.created_at DESC
	`

	if err := db.Raw(query).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to query teachers: %w", err)
	}

	if results == nil {
		results = []models.TeacherResponse{}
	}

	return results, nil
}

// UpdateTeacher updates teacher profile details and user name/email
func UpdateTeacher(db *gorm.DB, teacherID string, input *UpdateTeacherInput) error {
	cleanEmail := strings.ToLower(strings.TrimSpace(input.Email))
	cleanEmpID := strings.TrimSpace(input.EmployeeID)

	var teacher models.Teacher
	if err := db.Where("id = ?", teacherID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Teacher not found")
		}
		return err
	}

	// Check email collision
	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ? AND id <> ?", cleanEmail, teacher.UserID).Count(&count)
	if count > 0 {
		return errors.New("Email is already registered by another account.")
	}

	// Check employee ID collision
	db.Model(&models.Teacher{}).Where("employee_id = ? AND id <> ?", cleanEmpID, teacherID).Count(&count)
	if count > 0 {
		return errors.New("Employee ID already exists.")
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", teacher.UserID).Updates(map[string]interface{}{
			"name":  strings.TrimSpace(input.Name),
			"email": cleanEmail,
		}).Error; err != nil {
			return err
		}

		return tx.Model(&teacher).Updates(map[string]interface{}{
			"employee_id": cleanEmpID,
			"department":  strings.TrimSpace(input.Department),
		}).Error
	})
}

// ToggleTeacherStatus deactivates or activates a teacher's user account
func ToggleTeacherStatus(db *gorm.DB, teacherID string, isActive bool) error {
	var teacher models.Teacher
	if err := db.Where("id = ?", teacherID).First(&teacher).Error; err != nil {
		return errors.New("Teacher not found")
	}

	return db.Model(&models.User{}).Where("id = ?", teacher.UserID).Update("is_active", isActive).Error
}

// GetDashboardStats calculates live total and active student and teacher counts
func GetDashboardStats(db *gorm.DB) (*models.DashboardStatsResponse, error) {
	var resp models.DashboardStatsResponse
	resp.Success = true

	// Student counts
	db.Model(&models.Student{}).Count(&resp.Students.Total)
	db.Table("students s").
		Joins("JOIN users u ON s.user_id = u.id").
		Where("u.is_active = ?", true).
		Count(&resp.Students.Active)

	// Teacher counts
	db.Model(&models.Teacher{}).Count(&resp.Teachers.Total)
	db.Table("teachers t").
		Joins("JOIN users u ON t.user_id = u.id").
		Where("u.is_active = ?", true).
		Count(&resp.Teachers.Active)

	return &resp, nil
}
