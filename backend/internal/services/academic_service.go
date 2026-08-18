package services

import (
	"errors"
	"fmt"
	"strings"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

// CreateSubjectInput validates subject creation payload
type CreateSubjectInput struct {
	Name       string `json:"name" binding:"required"`
	Code       string `json:"code" binding:"required"`
	Department string `json:"department" binding:"required"`
	Semester   int    `json:"semester" binding:"required,min=1,max=12"`
}

// UpdateSubjectInput validates subject editing payload
type UpdateSubjectInput struct {
	Name       string `json:"name" binding:"required"`
	Code       string `json:"code" binding:"required"`
	Department string `json:"department" binding:"required"`
	Semester   int    `json:"semester" binding:"required,min=1,max=12"`
}

// CreateClassInput validates class creation payload
type CreateClassInput struct {
	Name         string `json:"name" binding:"required"`
	Department   string `json:"department" binding:"required"`
	Semester     int    `json:"semester" binding:"required,min=1,max=12"`
	Section      string `json:"section" binding:"required"`
	AcademicYear string `json:"academic_year" binding:"required"`
}

// UpdateClassInput validates class editing payload
type UpdateClassInput struct {
	Name         string `json:"name" binding:"required"`
	Department   string `json:"department" binding:"required"`
	Semester     int    `json:"semester" binding:"required,min=1,max=12"`
	Section      string `json:"section" binding:"required"`
	AcademicYear string `json:"academic_year" binding:"required"`
}

// AssignStudentClassInput validates student class assignment
type AssignStudentClassInput struct {
	ClassID *string `json:"class_id"`
}

// CreateAssignmentInput validates teacher-subject-class assignment
type CreateAssignmentInput struct {
	TeacherID string `json:"teacher_id" binding:"required"`
	SubjectID string `json:"subject_id" binding:"required"`
	ClassID   string `json:"class_id" binding:"required"`
}

// ==============================================================================
// SUBJECT SERVICES
// ==============================================================================

// GetSubjects returns all academic subjects sorted by semester and name
func GetSubjects(db *gorm.DB) ([]models.SubjectResponse, error) {
	var subjects []models.Subject
	if err := db.Order("semester ASC, name ASC").Find(&subjects).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve subjects: %w", err)
	}

	results := make([]models.SubjectResponse, len(subjects))
	for i, s := range subjects {
		results[i] = models.SubjectResponse{
			ID:         s.ID,
			Name:       s.Name,
			Code:       s.Code,
			Department: s.Department,
			Semester:   s.Semester,
			CreatedAt:  s.CreatedAt,
		}
	}
	return results, nil
}

// CreateSubject creates a new subject after validating code uniqueness
func CreateSubject(db *gorm.DB, input *CreateSubjectInput) (*models.SubjectResponse, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(input.Code))
	cleanName := strings.TrimSpace(input.Name)
	cleanDept := strings.TrimSpace(input.Department)

	var count int64
	db.Model(&models.Subject{}).Where("UPPER(code) = ?", cleanCode).Count(&count)
	if count > 0 {
		return nil, errors.New("Subject code already exists.")
	}

	subject := models.Subject{
		Name:       cleanName,
		Code:       cleanCode,
		Department: cleanDept,
		Semester:   input.Semester,
	}

	if err := db.Create(&subject).Error; err != nil {
		return nil, fmt.Errorf("failed to save subject: %w", err)
	}

	return &models.SubjectResponse{
		ID:         subject.ID,
		Name:       subject.Name,
		Code:       subject.Code,
		Department: subject.Department,
		Semester:   subject.Semester,
		CreatedAt:  subject.CreatedAt,
	}, nil
}

// UpdateSubject modifies an existing subject
func UpdateSubject(db *gorm.DB, id string, input *UpdateSubjectInput) error {
	cleanCode := strings.ToUpper(strings.TrimSpace(input.Code))
	cleanName := strings.TrimSpace(input.Name)
	cleanDept := strings.TrimSpace(input.Department)

	var existing models.Subject
	if err := db.Where("id = ?", id).First(&existing).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Subject not found.")
		}
		return err
	}

	var count int64
	db.Model(&models.Subject{}).Where("UPPER(code) = ? AND id <> ?", cleanCode, id).Count(&count)
	if count > 0 {
		return errors.New("Subject code already exists.")
	}

	return db.Model(&existing).Updates(map[string]interface{}{
		"name":       cleanName,
		"code":       cleanCode,
		"department": cleanDept,
		"semester":   input.Semester,
	}).Error
}

// DeleteSubject deletes a subject only if it has no teaching assignments
func DeleteSubject(db *gorm.DB, id string) error {
	var count int64
	db.Model(&models.TeacherSubjectClass{}).Where("subject_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("Cannot delete subject because it is assigned to a teacher and class.")
	}

	res := db.Where("id = ?", id).Delete(&models.Subject{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("Subject not found.")
	}
	return nil
}

// ==============================================================================
// CLASS SERVICES
// ==============================================================================

// GetClasses returns all classes with dynamic student counts
func GetClasses(db *gorm.DB) ([]models.ClassResponse, error) {
	type classWithCount struct {
		models.Class
		StudentCount int64 `json:"student_count"`
	}

	var rows []classWithCount
	query := `
		SELECT 
			c.*,
			COALESCE(COUNT(s.id), 0) AS student_count
		FROM classes c
		LEFT JOIN students s ON s.class_id = c.id
		GROUP BY c.id
		ORDER BY c.academic_year DESC, c.department ASC, c.semester ASC, c.section ASC
	`

	if err := db.Raw(query).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve classes: %w", err)
	}

	results := make([]models.ClassResponse, len(rows))
	for i, r := range rows {
		results[i] = models.ClassResponse{
			ID:           r.ID,
			Name:         r.Name,
			Department:   r.Department,
			Semester:     r.Semester,
			Section:      r.Section,
			AcademicYear: r.AcademicYear,
			StudentCount: r.StudentCount,
			CreatedAt:    r.CreatedAt,
		}
	}
	return results, nil
}

// CreateClass creates a new academic class after checking duplicate definitions
func CreateClass(db *gorm.DB, input *CreateClassInput) (*models.ClassResponse, error) {
	cleanName := strings.TrimSpace(input.Name)
	cleanDept := strings.TrimSpace(input.Department)
	cleanSec := strings.ToUpper(strings.TrimSpace(input.Section))
	cleanYear := strings.TrimSpace(input.AcademicYear)

	var count int64
	db.Model(&models.Class{}).
		Where("LOWER(department) = ? AND semester = ? AND UPPER(section) = ? AND academic_year = ?",
			strings.ToLower(cleanDept), input.Semester, cleanSec, cleanYear).
		Count(&count)

	if count > 0 {
		return nil, errors.New("A class with this department, semester, section, and academic year already exists.")
	}

	class := models.Class{
		Name:         cleanName,
		Department:   cleanDept,
		Semester:     input.Semester,
		Section:      cleanSec,
		AcademicYear: cleanYear,
	}

	if err := db.Create(&class).Error; err != nil {
		return nil, fmt.Errorf("failed to save class: %w", err)
	}

	return &models.ClassResponse{
		ID:           class.ID,
		Name:         class.Name,
		Department:   class.Department,
		Semester:     class.Semester,
		Section:      class.Section,
		AcademicYear: class.AcademicYear,
		StudentCount: 0,
		CreatedAt:    class.CreatedAt,
	}, nil
}

// UpdateClass modifies an existing class batch
func UpdateClass(db *gorm.DB, id string, input *UpdateClassInput) error {
	cleanName := strings.TrimSpace(input.Name)
	cleanDept := strings.TrimSpace(input.Department)
	cleanSec := strings.ToUpper(strings.TrimSpace(input.Section))
	cleanYear := strings.TrimSpace(input.AcademicYear)

	var existing models.Class
	if err := db.Where("id = ?", id).First(&existing).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Class not found.")
		}
		return err
	}

	var count int64
	db.Model(&models.Class{}).
		Where("LOWER(department) = ? AND semester = ? AND UPPER(section) = ? AND academic_year = ? AND id <> ?",
			strings.ToLower(cleanDept), input.Semester, cleanSec, cleanYear, id).
		Count(&count)

	if count > 0 {
		return errors.New("A class with this department, semester, section, and academic year already exists.")
	}

	return db.Model(&existing).Updates(map[string]interface{}{
		"name":          cleanName,
		"department":    cleanDept,
		"semester":      input.Semester,
		"section":       cleanSec,
		"academic_year": cleanYear,
	}).Error
}

// DeleteClass deletes a class only if no students or teaching assignments are linked
func DeleteClass(db *gorm.DB, id string) error {
	var studentCount int64
	db.Model(&models.Student{}).Where("class_id = ?", id).Count(&studentCount)

	var assignmentCount int64
	db.Model(&models.TeacherSubjectClass{}).Where("class_id = ?", id).Count(&assignmentCount)

	if studentCount > 0 || assignmentCount > 0 {
		return errors.New("Cannot delete class because students or teaching assignments are linked to it.")
	}

	res := db.Where("id = ?", id).Delete(&models.Class{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("Class not found.")
	}
	return nil
}

// ==============================================================================
// STUDENT CLASS ASSIGNMENT SERVICES
// ==============================================================================

// AssignStudentClass updates the class_id of a student (or unassigns if nil/empty)
func AssignStudentClass(db *gorm.DB, studentID string, classID *string) error {
	var student models.Student
	if err := db.Where("id = ?", studentID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Student not found.")
		}
		return err
	}

	if classID != nil && strings.TrimSpace(*classID) != "" {
		cleanClassID := strings.TrimSpace(*classID)
		var class models.Class
		if err := db.Where("id = ?", cleanClassID).First(&class).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("Selected class not found.")
			}
			return err
		}
		return db.Model(&student).Update("class_id", cleanClassID).Error
	}

	// Unassign student from class
	return db.Model(&student).Update("class_id", gorm.Expr("NULL")).Error
}

// ==============================================================================
// TEACHING ASSIGNMENTS SERVICES (Teacher -> Subject -> Class)
// ==============================================================================

// GetAssignments returns all teacher-subject-class assignments
func GetAssignments(db *gorm.DB) ([]models.AssignmentResponse, error) {
	var results []models.AssignmentResponse

	query := `
		SELECT 
			tsc.id,
			t.id AS teacher_id,
			u.name AS teacher_name,
			t.employee_id AS teacher_employee_id,
			s.id AS subject_id,
			s.name AS subject_name,
			s.code AS subject_code,
			c.id AS class_id,
			c.name AS class_name,
			c.department,
			c.semester,
			c.section,
			c.academic_year,
			tsc.created_at
		FROM teacher_subject_classes tsc
		JOIN teachers t ON tsc.teacher_id = t.id
		JOIN users u ON t.user_id = u.id
		JOIN subjects s ON tsc.subject_id = s.id
		JOIN classes c ON tsc.class_id = c.id
		ORDER BY tsc.created_at DESC
	`

	if err := db.Raw(query).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve assignments: %w", err)
	}

	if results == nil {
		results = []models.AssignmentResponse{}
	}
	return results, nil
}

// CreateAssignment links a teacher, subject, and class
func CreateAssignment(db *gorm.DB, input *CreateAssignmentInput) (*models.AssignmentResponse, error) {
	teacherID := strings.TrimSpace(input.TeacherID)
	subjectID := strings.TrimSpace(input.SubjectID)
	classID := strings.TrimSpace(input.ClassID)

	// 1. Verify Teacher exists and is active
	var teacher models.Teacher
	if err := db.Preload("User").Where("id = ?", teacherID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher not found.")
		}
		return nil, err
	}
	if !teacher.User.IsActive {
		return nil, errors.New("Cannot assign subject to an inactive teacher.")
	}

	// 2. Verify Subject exists
	var subject models.Subject
	if err := db.Where("id = ?", subjectID).First(&subject).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Subject not found.")
		}
		return nil, err
	}

	// 3. Verify Class exists
	var class models.Class
	if err := db.Where("id = ?", classID).First(&class).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Class not found.")
		}
		return nil, err
	}

	// 4. Check duplicate assignment
	var count int64
	db.Model(&models.TeacherSubjectClass{}).
		Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacherID, subjectID, classID).
		Count(&count)
	if count > 0 {
		return nil, errors.New("This teaching assignment already exists.")
	}

	assignment := models.TeacherSubjectClass{
		TeacherID: teacherID,
		SubjectID: subjectID,
		ClassID:   classID,
	}

	if err := db.Create(&assignment).Error; err != nil {
		return nil, fmt.Errorf("failed to save assignment: %w", err)
	}

	return &models.AssignmentResponse{
		ID:                assignment.ID,
		TeacherID:         teacher.ID,
		TeacherName:       teacher.User.Name,
		TeacherEmployeeID: teacher.EmployeeID,
		SubjectID:         subject.ID,
		SubjectName:       subject.Name,
		SubjectCode:       subject.Code,
		ClassID:           class.ID,
		ClassName:         class.Name,
		Department:        class.Department,
		Semester:          class.Semester,
		Section:           class.Section,
		AcademicYear:      class.AcademicYear,
		CreatedAt:         assignment.CreatedAt,
	}, nil
}

// DeleteAssignment removes a teaching assignment
func DeleteAssignment(db *gorm.DB, id string) error {
	res := db.Where("id = ?", id).Delete(&models.TeacherSubjectClass{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("Assignment not found.")
	}
	return nil
}

// ==============================================================================
// TEACHER PORTAL SERVICES
// ==============================================================================

// GetTeacherProfileByUserID returns the authenticated teacher's profile
func GetTeacherProfileByUserID(db *gorm.DB, userID string) (*models.TeacherProfileResponse, error) {
	var teacher models.Teacher
	if err := db.Preload("User").Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher profile not found.")
		}
		return nil, err
	}

	return &models.TeacherProfileResponse{
		ID:         teacher.ID,
		UserID:     teacher.UserID,
		Name:       teacher.User.Name,
		Email:      teacher.User.Email,
		EmployeeID: teacher.EmployeeID,
		Department: teacher.Department,
		Phone:      teacher.Phone,
		Address:    teacher.Address,
		Role:       teacher.User.Role,
		IsActive:   teacher.User.IsActive,
		CreatedAt:  teacher.CreatedAt,
	}, nil
}

// GetTeacherAssignmentsByUserID returns classes/subjects assigned to the logged-in teacher
func GetTeacherAssignmentsByUserID(db *gorm.DB, userID string) ([]models.TeacherAssignmentItem, error) {
	var teacher models.Teacher
	if err := db.Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher not found.")
		}
		return nil, err
	}

	var results []models.TeacherAssignmentItem
	query := `
		SELECT 
			tsc.id AS assignment_id,
			tsc.subject_id,
			s.name AS subject,
			s.code,
			tsc.class_id,
			c.name AS class,
			c.department,
			c.semester,
			c.section,
			c.academic_year
		FROM teacher_subject_classes tsc
		JOIN subjects s ON tsc.subject_id = s.id
		JOIN classes c ON tsc.class_id = c.id
		WHERE tsc.teacher_id = ?
		ORDER BY s.semester ASC, s.name ASC
	`

	if err := db.Raw(query, teacher.ID).Scan(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve teacher assignments: %w", err)
	}

	if results == nil {
		results = []models.TeacherAssignmentItem{}
	}
	return results, nil
}

// ==============================================================================
// STUDENT PORTAL SERVICES
// ==============================================================================

// GetStudentProfileByUserID returns student information including assigned class
func GetStudentProfileByUserID(db *gorm.DB, userID string) (*models.StudentProfileResponse, error) {
	return GetStudentProfile(db, userID)
}

// GetStudentSubjectsByUserID returns the list of subjects linked to the student's assigned class
func GetStudentSubjectsByUserID(db *gorm.DB, userID string) ([]models.SubjectResponse, error) {
	var student models.Student
	if err := db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Student profile not found.")
		}
		return nil, err
	}

	if student.ClassID == nil || *student.ClassID == "" {
		return []models.SubjectResponse{}, nil
	}

	var subjects []models.SubjectResponse
	query := `
		SELECT DISTINCT 
			s.id, s.name, s.code, s.department, s.semester, s.created_at
		FROM teacher_subject_classes tsc
		JOIN subjects s ON tsc.subject_id = s.id
		WHERE tsc.class_id = ?
		ORDER BY s.semester ASC, s.name ASC
	`

	if err := db.Raw(query, *student.ClassID).Scan(&subjects).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve student subjects: %w", err)
	}

	if subjects == nil {
		subjects = []models.SubjectResponse{}
	}
	return subjects, nil
}
