package services

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

// GetTeacherFullProfile retrieves comprehensive teacher profile, academic assignments, and teaching metrics
func GetTeacherFullProfile(db *gorm.DB, userID string) (*models.TeacherFullProfileResponse, error) {
	if userID == "" {
		return nil, errors.New("unauthorized: missing user identifier")
	}

	var teacher models.Teacher
	if err := db.Preload("User").Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("teacher profile not found")
		}
		return nil, err
	}

	// 1. Fetch all assignments for this teacher
	var assignments []models.TeacherAssignmentItem
	assignmentQuery := `
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
	if err := db.Raw(assignmentQuery, teacher.ID).Scan(&assignments).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve teacher assignments: %w", err)
	}

	// 2. Aggregate distinct subjects
	subjectMap := make(map[string]*models.TeacherSubjectAssignment)
	for _, item := range assignments {
		subj, exists := subjectMap[item.SubjectID]
		if !exists {
			subj = &models.TeacherSubjectAssignment{
				SubjectID:    item.SubjectID,
				Name:         item.Subject,
				Code:         item.Code,
				Department:   item.Department,
				Semester:     item.Semester,
				ClassesCount: 0,
				ClassNames:   []string{},
			}
			subjectMap[item.SubjectID] = subj
		}
		subj.ClassesCount++
		subj.ClassNames = append(subj.ClassNames, item.Class)
	}

	var subjectList []models.TeacherSubjectAssignment
	for _, s := range subjectMap {
		subjectList = append(subjectList, *s)
	}
	sort.Slice(subjectList, func(i, j int) bool {
		if subjectList[i].Semester == subjectList[j].Semester {
			return subjectList[i].Name < subjectList[j].Name
		}
		return subjectList[i].Semester < subjectList[j].Semester
	})

	// 3. Aggregate distinct classes and fetch student counts
	classMap := make(map[string]*models.TeacherClassAssignment)
	for _, item := range assignments {
		if _, exists := classMap[item.ClassID]; !exists {
			classMap[item.ClassID] = &models.TeacherClassAssignment{
				ClassID:      item.ClassID,
				Name:         item.Class,
				Department:   item.Department,
				Semester:     item.Semester,
				Section:      item.Section,
				AcademicYear: item.AcademicYear,
				StudentCount: 0,
			}
		}
	}

	// Fetch student counts for each distinct class
	for classID, classItem := range classMap {
		var count int64
		db.Model(&models.Student{}).Where("class_id = ?", classID).Count(&count)
		classItem.StudentCount = count
	}

	var classList []models.TeacherClassAssignment
	for _, c := range classMap {
		classList = append(classList, *c)
	}
	sort.Slice(classList, func(i, j int) bool {
		if classList[i].Semester == classList[j].Semester {
			return classList[i].Name < classList[j].Name
		}
		return classList[i].Semester < classList[j].Semester
	})

	// 4. Calculate Teaching Statistics
	var totalSessions int64
	db.Model(&models.AttendanceSession{}).Where("teacher_id = ?", teacher.ID).Count(&totalSessions)

	var finalizedSessions int64
	db.Model(&models.AttendanceSession{}).
		Where("teacher_id = ? AND (finalization_status = 'FINALIZED' OR finalization_status = 'LOCKED')", teacher.ID).
		Count(&finalizedSessions)

	openSessions := totalSessions - finalizedSessions
	if openSessions < 0 {
		openSessions = 0
	}

	var totalStudentsUnderScope int64
	studentScopeQuery := `
		SELECT COUNT(DISTINCT s.id) 
		FROM students s 
		JOIN teacher_subject_classes tsc ON s.class_id = tsc.class_id 
		WHERE tsc.teacher_id = ?
	`
	db.Raw(studentScopeQuery, teacher.ID).Scan(&totalStudentsUnderScope)

	// Calculate overall attendance and late percentage across teacher's sessions
	type statusCount struct {
		Status string
		Count  int64
	}
	var counts []statusCount
	statusQuery := `
		SELECT a.status, COUNT(a.id) as count 
		FROM attendance a 
		JOIN attendance_sessions s ON a.session_id = s.id 
		WHERE s.teacher_id = ? 
		GROUP BY a.status
	`
	db.Raw(statusQuery, teacher.ID).Scan(&counts)

	var presentCount, lateCount, absentCount int64
	for _, sc := range counts {
		switch strings.ToUpper(strings.TrimSpace(sc.Status)) {
		case "PRESENT":
			presentCount = sc.Count
		case "LATE":
			lateCount = sc.Count
		case "ABSENT":
			absentCount = sc.Count
		}
	}

	totalMarked := presentCount + lateCount + absentCount
	var overallAttPct, latePct float64
	if totalMarked > 0 {
		attended := presentCount + lateCount
		overallAttPct = math.Round((float64(attended)/float64(totalMarked)*100)*10) / 10
		latePct = math.Round((float64(lateCount)/float64(totalMarked)*100)*10) / 10
	}

	// 5. Construct Profile Response
	resp := &models.TeacherFullProfileResponse{
		Teacher: models.TeacherProfileResponse{
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
		},
		Assignments: models.TeacherAssignmentsPayload{
			Subjects: subjectList,
			Classes:  classList,
		},
		TeachingSummary: models.TeacherTeachingStats{
			SessionsConducted:           totalSessions,
			FinalizedSessions:           finalizedSessions,
			OpenSessions:                openSessions,
			StudentsCount:               totalStudentsUnderScope,
			ClassesCount:                len(classList),
			SubjectsCount:               len(subjectList),
			OverallAttendancePercentage: overallAttPct,
			LatePercentage:              latePct,
		},
	}

	return resp, nil
}

// UpdateTeacherProfile updates permitted teacher personal contact details (phone, address)
func UpdateTeacherProfile(db *gorm.DB, userID string, req models.TeacherProfileUpdateRequest) (*models.TeacherFullProfileResponse, error) {
	if userID == "" {
		return nil, errors.New("unauthorized: missing user identifier")
	}

	var teacher models.Teacher
	if err := db.Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("teacher profile not found")
		}
		return nil, err
	}

	// Validate and sanitize Phone if provided
	if req.Phone != nil {
		trimmedPhone := strings.TrimSpace(*req.Phone)
		if len(trimmedPhone) > 20 {
			return nil, errors.New("phone number cannot exceed 20 characters")
		}
		if trimmedPhone == "" {
			teacher.Phone = nil
		} else {
			teacher.Phone = &trimmedPhone
		}
	}

	// Validate and sanitize Address if provided
	if req.Address != nil {
		trimmedAddress := strings.TrimSpace(*req.Address)
		if len(trimmedAddress) > 255 {
			return nil, errors.New("address cannot exceed 255 characters")
		}
		if trimmedAddress == "" {
			teacher.Address = nil
		} else {
			teacher.Address = &trimmedAddress
		}
	}

	if err := db.Save(&teacher).Error; err != nil {
		return nil, err
	}

	return GetTeacherFullProfile(db, userID)
}

// ChangeTeacherPassword validates current password and sets a secure bcrypt-hashed new password
func ChangeTeacherPassword(db *gorm.DB, userID string, req models.ChangePasswordRequest) error {
	if userID == "" {
		return errors.New("unauthorized: missing user identifier")
	}

	currentPassword := strings.TrimSpace(req.CurrentPassword)
	if currentPassword == "" {
		return errors.New("current password is required")
	}

	newPassword := strings.TrimSpace(req.NewPassword)
	if len(newPassword) < 6 {
		return errors.New("new password must be at least 6 characters in length")
	}
	if len(newPassword) > 128 {
		return errors.New("new password cannot exceed 128 characters")
	}

	var user models.User
	if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user account not found")
		}
		return err
	}

	if !user.IsActive {
		return errors.New("account is inactive; password changes are restricted")
	}

	// Verify current password with constant-time comparison
	if !CheckPassword(user.PasswordHash, currentPassword) {
		return errors.New("current password is incorrect")
	}

	// Generate secure bcrypt hash for new password
	newHash, err := HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to securely hash new password")
	}

	// Persist updated hash
	if err := db.Model(&user).Update("password_hash", newHash).Error; err != nil {
		return err
	}

	return nil
}
