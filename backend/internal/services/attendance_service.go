package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Sentinel errors for attendance engine validation
var (
	ErrSessionTokenRequired    = errors.New("Session token is required.")
	ErrStudentProfileNotFound  = errors.New("Student profile not found.")
	ErrStudentAccountInactive  = errors.New("Student account is inactive.")
	ErrStudentNotAssignedClass = errors.New("You are not assigned to an academic class.")
	ErrInvalidSessionToken     = errors.New("Invalid QR code or session token not found.")
	ErrSessionEnded            = errors.New("Attendance session has ended.")
	ErrSessionExpired          = errors.New("This attendance session has expired.")
	ErrWrongClass              = errors.New("You are not enrolled in this class.")
	ErrDuplicateAttendance     = errors.New("Attendance has already been marked for this session.")

	// Feature #11 & #12 Sentinel Errors
	ErrReasonRequired          = errors.New("A reason is mandatory for manual attendance and corrections.")
	ErrReasonTooShort          = errors.New("Reason must be at least 5 characters long.")
	ErrReasonTooLong           = errors.New("Reason cannot exceed 500 characters.")
	ErrInvalidAttendanceStatus = errors.New("Invalid attendance status. Allowed values are PRESENT, LATE, or ABSENT.")
	ErrSameStatusCorrection    = errors.New("New status must be different from current status.")
	ErrAttendanceNotFound      = errors.New("Attendance record not found.")
	ErrUnauthorizedTeacher     = errors.New("You are not authorized to mark or correct attendance for this student or session.")
	ErrStudentNotFound         = errors.New("Student not found.")
	ErrSessionNotFound         = errors.New("Attendance session not found.")
	ErrStudentClassMismatch    = errors.New("Student does not belong to the class for this attendance session.")
)

// ValidateAttendanceReason validates that the explanatory reason meets length and non-empty criteria
func ValidateAttendanceReason(reason string) (string, error) {
	clean := strings.TrimSpace(reason)
	if clean == "" {
		return "", ErrReasonRequired
	}
	if len(clean) < 5 {
		return "", ErrReasonTooShort
	}
	if len(clean) > 500 {
		return "", ErrReasonTooLong
	}
	return clean, nil
}

// ValidateAttendanceStatus validates that the status is PRESENT, LATE, or ABSENT
func ValidateAttendanceStatus(status string) (string, error) {
	clean := strings.ToUpper(strings.TrimSpace(status))
	if clean != models.StatusPresent && clean != models.StatusLate && clean != models.StatusAbsent {
		return "", ErrInvalidAttendanceStatus
	}
	return clean, nil
}

// CreateSessionInput defines the payload required by a teacher to launch a live attendance session
type CreateSessionInput struct {
	SubjectID            string `json:"subject_id" binding:"required"`
	ClassID              string `json:"class_id" binding:"required"`
	DurationMinutes      int    `json:"duration_minutes" binding:"required,min=1,max=60"`
	LateThresholdMinutes *int   `json:"late_threshold_minutes,omitempty"`
}

// MarkAttendanceInput defines the student token submission payload
type MarkAttendanceInput struct {
	SessionToken string `json:"session_token" binding:"required"`
}

// GenerateSecureToken generates a cryptographically random, unguessable session token
func GenerateSecureToken() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate crypto token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// ==============================================================================
// TEACHER ATTENDANCE SERVICES
// ==============================================================================

// CreateAttendanceSession creates a new live session with duration expiry after verifying teacher allocation
func CreateAttendanceSession(db *gorm.DB, teacherUserID string, input *CreateSessionInput) (*models.AttendanceSessionResponse, error) {
	// 1. Find teacher profile
	var teacher models.Teacher
	if err := db.Preload("User").Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return nil, errors.New("Teacher profile not found.")
	}
	if !teacher.User.IsActive {
		return nil, errors.New("Teacher account is inactive.")
	}

	subjectID := strings.TrimSpace(input.SubjectID)
	classID := strings.TrimSpace(input.ClassID)

	// 2. Validate duration (allowed 1, 5, 10 or up to 60; default 5)
	duration := input.DurationMinutes
	if duration <= 0 {
		duration = 5
	}

	lateThreshold := 10
	if input.LateThresholdMinutes != nil {
		if *input.LateThresholdMinutes < 0 || *input.LateThresholdMinutes > 180 {
			return nil, errors.New("Late threshold must be between 0 and 180 minutes.")
		}
		lateThreshold = *input.LateThresholdMinutes
	}

	// 3. Verify teacher is allocated to teach this subject and class
	var assignmentCount int64
	db.Model(&models.TeacherSubjectClass{}).
		Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacher.ID, subjectID, classID).
		Count(&assignmentCount)
	if assignmentCount == 0 {
		return nil, errors.New("You are not authorized to start attendance for a subject or class you do not teach.")
	}

	// 4. Verify subject and class records
	var subject models.Subject
	if err := db.Where("id = ?", subjectID).First(&subject).Error; err != nil {
		return nil, errors.New("Subject not found.")
	}

	var class models.Class
	if err := db.Where("id = ?", classID).First(&class).Error; err != nil {
		return nil, errors.New("Class not found.")
	}

	// 5. Generate secure crypto token
	token, err := GenerateSecureToken()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	expiresAt := now.Add(time.Duration(duration) * time.Minute)

	session := models.AttendanceSession{
		TeacherID:            teacher.ID,
		SubjectID:            subject.ID,
		ClassID:              class.ID,
		SessionToken:         token,
		StartedAt:            now,
		ExpiresAt:            expiresAt,
		LateThresholdMinutes: lateThreshold,
		IsActive:             true,
	}

	if err := db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to save attendance session: %w", err)
	}

	// Total students in class
	var totalStudents int64
	db.Model(&models.Student{}).Where("class_id = ?", class.ID).Count(&totalStudents)

	durationMins := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	lateAfter := session.StartedAt.Add(time.Duration(lateThreshold) * time.Minute)

	return &models.AttendanceSessionResponse{
		ID:                   session.ID,
		TeacherID:            teacher.ID,
		TeacherName:          teacher.User.Name,
		TeacherEmployeeID:    teacher.EmployeeID,
		SubjectID:            subject.ID,
		SubjectName:          subject.Name,
		SubjectCode:          subject.Code,
		ClassID:              class.ID,
		ClassName:            class.Name,
		Department:           class.Department,
		Semester:             class.Semester,
		Section:              class.Section,
		AcademicYear:         class.AcademicYear,
		SessionToken:         session.SessionToken,
		StartedAt:            session.StartedAt,
		ExpiresAt:            session.ExpiresAt,
		DurationMinutes:      durationMins,
		LateThresholdMinutes: lateThreshold,
		LateAfter:            lateAfter,
		IsActive:             session.IsActive,
		IsExpired:            false,
		PresentCount:         0,
		LateCount:            0,
		AbsentCount:          totalStudents,
		TotalStudents:        totalStudents,
		Percentage:           0.0,
		LatePercentage:       0.0,
		Status:               "ACTIVE",
		CreatedAt:            session.CreatedAt,
	}, nil
}

// UpdateSessionLateSettings modifies the late threshold for an attendance session after verifying teacher ownership
func UpdateSessionLateSettings(db *gorm.DB, teacherUserID string, sessionID string, lateThresholdMinutes int) (*models.UpdateLateSettingsResponse, error) {
	if lateThresholdMinutes < 0 || lateThresholdMinutes > 180 {
		return nil, errors.New("Late threshold must be between 0 and 180 minutes.")
	}

	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return nil, errors.New("Teacher profile not found.")
	}

	var session models.AttendanceSession
	if err := db.Where("id = ? AND teacher_id = ?", sessionID, teacher.ID).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Attendance session not found or access denied.")
		}
		return nil, err
	}

	if err := db.Model(&session).Update("late_threshold_minutes", lateThresholdMinutes).Error; err != nil {
		return nil, fmt.Errorf("failed to update late threshold: %w", err)
	}

	lateAfter := session.StartedAt.Add(time.Duration(lateThresholdMinutes) * time.Minute)

	return &models.UpdateLateSettingsResponse{
		SessionID:            session.ID,
		LateThresholdMinutes: lateThresholdMinutes,
		LateAfter:            lateAfter,
	}, nil
}

// computeSessionStatus calculates normalized status string
func computeSessionStatus(isActive, isExpired bool) string {
	if isActive && !isExpired {
		return "ACTIVE"
	}
	if !isActive {
		return "COMPLETED"
	}
	return "EXPIRED"
}

// computeDurationMinutes calculates elapsed/allocated duration in minutes
func computeDurationMinutes(startedAt, expiresAt time.Time) int {
	mins := int(math.Round(expiresAt.Sub(startedAt).Minutes()))
	if mins <= 0 {
		return 5
	}
	return mins
}

// computeAbsentCount calculates expected absent students
func computeAbsentCount(totalStudents, presentCount int64) int64 {
	absent := totalStudents - presentCount
	if absent < 0 {
		return 0
	}
	return absent
}

// GetTeacherSessions retrieves all attendance sessions created by the logged-in teacher with optional filtering
func GetTeacherSessions(db *gorm.DB, teacherUserID string, subjectFilter, classFilter, dateFilter, statusFilter string) ([]models.AttendanceSessionResponse, error) {
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return nil, errors.New("Teacher profile not found.")
	}

	query := db.Preload("Subject").Preload("Class").
		Where("teacher_id = ?", teacher.ID)

	if strings.TrimSpace(subjectFilter) != "" {
		query = query.Where("subject_id = ?", strings.TrimSpace(subjectFilter))
	}
	if strings.TrimSpace(classFilter) != "" {
		query = query.Where("class_id = ?", strings.TrimSpace(classFilter))
	}
	if strings.TrimSpace(dateFilter) != "" {
		query = query.Where("DATE(started_at) = ?", strings.TrimSpace(dateFilter))
	}

	now := time.Now().UTC()
	statusClean := strings.ToUpper(strings.TrimSpace(statusFilter))
	if statusClean == "ACTIVE" {
		query = query.Where("is_active = ? AND expires_at > ?", true, now)
	} else if statusClean == "COMPLETED" {
		query = query.Where("is_active = ? OR expires_at <= ?", false, now)
	} else if statusClean == "EXPIRED" {
		query = query.Where("expires_at <= ?", now)
	}

	var sessions []models.AttendanceSession
	if err := query.Order("started_at DESC").Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve teacher attendance sessions: %w", err)
	}

	results := make([]models.AttendanceSessionResponse, len(sessions))

	for i, s := range sessions {
		var presentCount int64
		db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'PRESENT'", s.ID).Count(&presentCount)

		var lateCount int64
		db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'LATE'", s.ID).Count(&lateCount)

		var totalStudents int64
		db.Model(&models.Student{}).Where("class_id = ?", s.ClassID).Count(&totalStudents)

		attendedCount := presentCount + lateCount
		pct := 0.0
		if totalStudents > 0 {
			pct = math.Round((float64(attendedCount)/float64(totalStudents))*1000) / 10
		}
		latePct := 0.0
		if totalStudents > 0 {
			latePct = math.Round((float64(lateCount)/float64(totalStudents))*1000) / 10
		}

		isExpired := now.After(s.ExpiresAt)
		duration := computeDurationMinutes(s.StartedAt, s.ExpiresAt)
		absentCount := computeAbsentCount(totalStudents, attendedCount)
		sessionStatus := computeSessionStatus(s.IsActive, isExpired)

		lateThresh := s.LateThresholdMinutes
		if lateThresh < 0 {
			lateThresh = 10
		}
		lateAfter := s.StartedAt.Add(time.Duration(lateThresh) * time.Minute)

		results[i] = models.AttendanceSessionResponse{
			ID:                   s.ID,
			TeacherID:            teacher.ID,
			TeacherName:          teacher.User.Name,
			TeacherEmployeeID:    teacher.EmployeeID,
			SubjectID:            s.SubjectID,
			SubjectName:          s.Subject.Name,
			SubjectCode:          s.Subject.Code,
			ClassID:              s.ClassID,
			ClassName:            s.Class.Name,
			Department:           s.Class.Department,
			Semester:             s.Class.Semester,
			Section:              s.Class.Section,
			AcademicYear:         s.Class.AcademicYear,
			SessionToken:         s.SessionToken,
			StartedAt:            s.StartedAt,
			ExpiresAt:            s.ExpiresAt,
			DurationMinutes:      duration,
			LateThresholdMinutes: lateThresh,
			LateAfter:            lateAfter,
			IsActive:             s.IsActive,
			IsExpired:            isExpired,
			PresentCount:         presentCount,
			LateCount:            lateCount,
			AbsentCount:          absentCount,
			TotalStudents:        totalStudents,
			Percentage:           pct,
			LatePercentage:       latePct,
			Status:               sessionStatus,
			CreatedAt:            s.CreatedAt,
		}
	}

	return results, nil
}

// GetTeacherSessionByID retrieves a single session by ID and verifies teacher ownership
func GetTeacherSessionByID(db *gorm.DB, teacherUserID string, sessionID string) (*models.AttendanceSessionResponse, error) {
	var teacher models.Teacher
	if err := db.Preload("User").Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return nil, errors.New("Teacher profile not found.")
	}

	var session models.AttendanceSession
	if err := db.Preload("Subject").Preload("Class").
		Where("id = ? AND teacher_id = ?", sessionID, teacher.ID).
		First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Attendance session not found or access denied.")
		}
		return nil, err
	}

	var presentCount int64
	db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'PRESENT'", session.ID).Count(&presentCount)

	var lateCount int64
	db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'LATE'", session.ID).Count(&lateCount)

	var totalStudents int64
	db.Model(&models.Student{}).Where("class_id = ?", session.ClassID).Count(&totalStudents)

	attendedCount := presentCount + lateCount
	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(attendedCount)/float64(totalStudents))*1000) / 10
	}
	latePct := 0.0
	if totalStudents > 0 {
		latePct = math.Round((float64(lateCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	absentCount := computeAbsentCount(totalStudents, attendedCount)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	lateThresh := session.LateThresholdMinutes
	if lateThresh < 0 {
		lateThresh = 10
	}
	lateAfter := session.StartedAt.Add(time.Duration(lateThresh) * time.Minute)

	return &models.AttendanceSessionResponse{
		ID:                   session.ID,
		TeacherID:            teacher.ID,
		TeacherName:          teacher.User.Name,
		TeacherEmployeeID:    teacher.EmployeeID,
		SubjectID:            session.SubjectID,
		SubjectName:          session.Subject.Name,
		SubjectCode:          session.Subject.Code,
		ClassID:              session.ClassID,
		ClassName:            session.Class.Name,
		Department:           session.Class.Department,
		Semester:             session.Class.Semester,
		Section:              session.Class.Section,
		AcademicYear:         session.Class.AcademicYear,
		SessionToken:         session.SessionToken,
		StartedAt:            session.StartedAt,
		ExpiresAt:            session.ExpiresAt,
		DurationMinutes:      duration,
		LateThresholdMinutes: lateThresh,
		LateAfter:            lateAfter,
		IsActive:             session.IsActive,
		IsExpired:            isExpired,
		PresentCount:         presentCount,
		LateCount:            lateCount,
		AbsentCount:          absentCount,
		TotalStudents:        totalStudents,
		Percentage:           pct,
		LatePercentage:       latePct,
		Status:               sessionStatus,
		CreatedAt:            session.CreatedAt,
	}, nil
}

// GetLiveSessionData returns real-time attendance polling metrics and recent check-ins for active session
func GetLiveSessionData(db *gorm.DB, teacherUserID string, sessionID string) (*models.LiveAttendanceSessionResponse, error) {
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return nil, errors.New("Teacher profile not found.")
	}

	var session models.AttendanceSession
	if err := db.Preload("Subject").Preload("Class").
		Where("id = ? AND teacher_id = ?", sessionID, teacher.ID).
		First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Attendance session not found or access denied.")
		}
		return nil, err
	}

	// Total students in class
	var totalStudents int64
	db.Model(&models.Student{}).Where("class_id = ?", session.ClassID).Count(&totalStudents)

	// Fetch all attendances for this session joined with student and user details, ordered newest marked_at first
	type presentRow struct {
		StudentID  string
		RollNumber string
		Name       string
		Email      string
		Status     string
		MarkedAt   time.Time
	}
	var presentRows []presentRow
	query := `
		SELECT a.student_id, s.roll_number, u.name, u.email, a.status, a.marked_at
		FROM attendance a
		JOIN students s ON a.student_id = s.id
		JOIN users u ON s.user_id = u.id
		WHERE a.session_id = ? AND a.status IN ('PRESENT', 'LATE')
		ORDER BY a.marked_at DESC
	`
	if err := db.Raw(query, session.ID).Scan(&presentRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch live attendance check-ins: %w", err)
	}

	var presentCount int64 = 0
	var lateCount int64 = 0
	for _, r := range presentRows {
		if r.Status == models.StatusLate {
			lateCount++
		} else {
			presentCount++
		}
	}

	attendedCount := presentCount + lateCount
	absentCount := computeAbsentCount(totalStudents, attendedCount)
	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(attendedCount)/float64(totalStudents))*1000) / 10
	}
	latePct := 0.0
	if totalStudents > 0 {
		latePct = math.Round((float64(lateCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	lateThresh := session.LateThresholdMinutes
	if lateThresh < 0 {
		lateThresh = 10
	}
	lateAfter := session.StartedAt.Add(time.Duration(lateThresh) * time.Minute)

	students := make([]models.AttendanceStudentRecord, len(presentRows))
	for i, r := range presentRows {
		mTime := r.MarkedAt
		students[i] = models.AttendanceStudentRecord{
			StudentID:  r.StudentID,
			RollNumber: r.RollNumber,
			Name:       r.Name,
			Email:      r.Email,
			Status:     r.Status,
			MarkedAt:   &mTime,
		}
	}

	return &models.LiveAttendanceSessionResponse{
		SessionID:            session.ID,
		Status:               sessionStatus,
		TotalStudents:        totalStudents,
		PresentCount:         presentCount,
		LateCount:            lateCount,
		AbsentCount:          absentCount,
		AttendancePercentage: pct,
		LatePercentage:       latePct,
		LateThresholdMinutes: lateThresh,
		LateAfter:            lateAfter,
		QRExpiresAt:          session.ExpiresAt,
		StartedAt:            session.StartedAt,
		DurationMinutes:      duration,
		IsActive:             session.IsActive,
		IsExpired:            isExpired,
		SubjectName:          session.Subject.Name,
		SubjectCode:          session.Subject.Code,
		ClassName:            session.Class.Name,
		Semester:             session.Class.Semester,
		Section:              session.Class.Section,
		Students:             students,
	}, nil
}

// EndAttendanceSession marks a session inactive (is_active = false)
func EndAttendanceSession(db *gorm.DB, teacherUserID string, sessionID string) error {
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		return errors.New("Teacher profile not found.")
	}

	res := db.Model(&models.AttendanceSession{}).
		Where("id = ? AND teacher_id = ?", sessionID, teacher.ID).
		Update("is_active", false)

	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("Attendance session not found or not owned by teacher.")
	}
	return nil
}

// GetSessionAttendanceRecords returns the full class roster with PRESENT/LATE (marked time) and dynamically calculated ABSENT
func GetSessionAttendanceRecords(db *gorm.DB, sessionID string, teacherUserID *string) (*models.SessionAttendanceDetailsResponse, error) {
	var session models.AttendanceSession
	query := db.Preload("Teacher.User").Preload("Subject").Preload("Class").Where("id = ?", sessionID)

	if teacherUserID != nil {
		var teacher models.Teacher
		if err := db.Where("user_id = ?", *teacherUserID).First(&teacher).Error; err != nil {
			return nil, errors.New("Teacher profile not found.")
		}
		query = query.Where("teacher_id = ?", teacher.ID)
	}

	if err := query.First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Attendance session not found or access denied.")
		}
		return nil, err
	}

	// 1. Fetch all students in the class
	type studentRow struct {
		ID         string
		RollNumber string
		Name       string
		Email      string
	}
	var classStudents []studentRow
	studentQuery := `
		SELECT s.id, s.roll_number, u.name, u.email
		FROM students s
		JOIN users u ON s.user_id = u.id
		WHERE s.class_id = ?
		ORDER BY s.roll_number ASC
	`
	if err := db.Raw(studentQuery, session.ClassID).Scan(&classStudents).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch class student list: %w", err)
	}

	// 2. Fetch attendance records for this session
	var attendances []models.Attendance
	if err := db.Where("session_id = ?", session.ID).Find(&attendances).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance entries: %w", err)
	}

	attMap := make(map[string]models.Attendance)
	for _, a := range attendances {
		attMap[a.StudentID] = a
	}

	// 3. Build full roster records
	records := make([]models.AttendanceStudentRecord, len(classStudents))
	var presentCount int64 = 0
	var lateCount int64 = 0

	for i, st := range classStudents {
		att, hasAtt := attMap[st.ID]
		if hasAtt && att.Status == models.StatusPresent {
			presentCount++
			tCopy := att.MarkedAt
			attID := att.ID
			records[i] = models.AttendanceStudentRecord{
				AttendanceID: &attID,
				StudentID:    st.ID,
				RollNumber:   st.RollNumber,
				Name:         st.Name,
				Email:        st.Email,
				Status:       models.StatusPresent,
				MarkedAt:     &tCopy,
			}
		} else if hasAtt && att.Status == models.StatusLate {
			lateCount++
			tCopy := att.MarkedAt
			attID := att.ID
			records[i] = models.AttendanceStudentRecord{
				AttendanceID: &attID,
				StudentID:    st.ID,
				RollNumber:   st.RollNumber,
				Name:         st.Name,
				Email:        st.Email,
				Status:       models.StatusLate,
				MarkedAt:     &tCopy,
			}
		} else if hasAtt && att.Status == models.StatusAbsent {
			tCopy := att.MarkedAt
			attID := att.ID
			records[i] = models.AttendanceStudentRecord{
				AttendanceID: &attID,
				StudentID:    st.ID,
				RollNumber:   st.RollNumber,
				Name:         st.Name,
				Email:        st.Email,
				Status:       models.StatusAbsent,
				MarkedAt:     &tCopy,
			}
		} else {
			records[i] = models.AttendanceStudentRecord{
				AttendanceID: nil,
				StudentID:    st.ID,
				RollNumber:   st.RollNumber,
				Name:         st.Name,
				Email:        st.Email,
				Status:       models.StatusAbsent,
				MarkedAt:     nil,
			}
		}
	}

	totalStudents := int64(len(classStudents))
	attendedCount := presentCount + lateCount
	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(attendedCount)/float64(totalStudents))*1000) / 10
	}
	latePct := 0.0
	if totalStudents > 0 {
		latePct = math.Round((float64(lateCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	absentCount := computeAbsentCount(totalStudents, attendedCount)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	lateThresh := session.LateThresholdMinutes
	if lateThresh < 0 {
		lateThresh = 10
	}
	lateAfter := session.StartedAt.Add(time.Duration(lateThresh) * time.Minute)

	return &models.SessionAttendanceDetailsResponse{
		Session: models.AttendanceSessionResponse{
			ID:                   session.ID,
			TeacherID:            session.TeacherID,
			TeacherName:          session.Teacher.User.Name,
			TeacherEmployeeID:    session.Teacher.EmployeeID,
			SubjectID:            session.SubjectID,
			SubjectName:          session.Subject.Name,
			SubjectCode:          session.Subject.Code,
			ClassID:              session.ClassID,
			ClassName:            session.Class.Name,
			Department:           session.Class.Department,
			Semester:             session.Class.Semester,
			Section:              session.Class.Section,
			AcademicYear:         session.Class.AcademicYear,
			SessionToken:         session.SessionToken,
			StartedAt:            session.StartedAt,
			ExpiresAt:            session.ExpiresAt,
			DurationMinutes:      duration,
			LateThresholdMinutes: lateThresh,
			LateAfter:            lateAfter,
			IsActive:             session.IsActive,
			IsExpired:            isExpired,
			PresentCount:         presentCount,
			LateCount:            lateCount,
			AbsentCount:          absentCount,
			TotalStudents:        totalStudents,
			Percentage:           pct,
			LatePercentage:       latePct,
			Status:               sessionStatus,
			CreatedAt:            session.CreatedAt,
		},
		Records:        records,
		PresentCount:   presentCount,
		LateCount:      lateCount,
		TotalStudents:  totalStudents,
		Percentage:     pct,
		LatePercentage: latePct,
	}, nil
}

// ==============================================================================
// STUDENT ATTENDANCE SERVICES
// ==============================================================================

// MarkStudentAttendance validates the QR token and logs student attendance atomically and safely
func MarkStudentAttendance(db *gorm.DB, studentUserID string, sessionToken string) (*models.MarkAttendanceResponse, error) {
	cleanToken := strings.TrimSpace(sessionToken)
	if cleanToken == "" {
		return nil, ErrSessionTokenRequired
	}

	var response *models.MarkAttendanceResponse

	err := db.Transaction(func(tx *gorm.DB) error {
		// 1. Find student profile and verify active state
		var student models.Student
		if err := tx.Preload("User").Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrStudentProfileNotFound
			}
			return fmt.Errorf("failed to retrieve student profile: %w", err)
		}
		if !student.User.IsActive {
			return ErrStudentAccountInactive
		}
		if student.ClassID == nil || strings.TrimSpace(*student.ClassID) == "" {
			return ErrStudentNotAssignedClass
		}

		// 2. Find attendance session by token
		var session models.AttendanceSession
		if err := tx.Preload("Subject").Preload("Class").Where("session_token = ?", cleanToken).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvalidSessionToken
			}
			return fmt.Errorf("failed to retrieve attendance session: %w", err)
		}

		// 3. Check if session was manually ended
		if !session.IsActive {
			return ErrSessionEnded
		}

		// 4. Check authoritative server time expiration (NOW < expires_at in UTC)
		serverNow := time.Now().UTC()
		if serverNow.After(session.ExpiresAt) {
			return ErrSessionExpired
		}

		// 5. Verify student belongs to the exact class associated with the session
		if *student.ClassID != session.ClassID {
			return ErrWrongClass
		}

		// 6. Application-level check for duplicate attendance submission
		var existingCount int64
		if err := tx.Model(&models.Attendance{}).
			Where("session_id = ? AND student_id = ?", session.ID, student.ID).
			Count(&existingCount).Error; err != nil {
			return fmt.Errorf("failed to verify existing attendance: %w", err)
		}
		if existingCount > 0 {
			return ErrDuplicateAttendance
		}

		// 7. Authoritative late detection based on server time and session threshold
		lateThreshold := session.LateThresholdMinutes
		if lateThreshold < 0 {
			lateThreshold = 10
		}
		lateCutoff := session.StartedAt.Add(time.Duration(lateThreshold) * time.Minute)
		status := models.StatusPresent
		if serverNow.After(lateCutoff) {
			status = models.StatusLate
		}

		// 8. Insert attendance record atomically
		attendance := models.Attendance{
			SessionID: session.ID,
			StudentID: student.ID,
			MarkedAt:  serverNow,
			Status:    status,
		}

		if err := tx.Create(&attendance).Error; err != nil {
			// Catch PostgreSQL unique constraint violation ("uq_session_student" / code 23505) under concurrency
			errStr := strings.ToLower(err.Error())
			if strings.Contains(errStr, "duplicate key") ||
				strings.Contains(errStr, "unique constraint") ||
				strings.Contains(errStr, "uq_session_student") ||
				strings.Contains(errStr, "23505") {
				return ErrDuplicateAttendance
			}
			return fmt.Errorf("failed to record attendance: %w", err)
		}

		response = &models.MarkAttendanceResponse{
			AttendanceID:         attendance.ID,
			SessionID:            session.ID,
			MarkedAt:             attendance.MarkedAt,
			SubjectName:          session.Subject.Name,
			SubjectCode:          session.Subject.Code,
			ClassName:            session.Class.Name,
			Status:               attendance.Status,
			LateThresholdMinutes: lateThreshold,
			LateAfter:            lateCutoff,
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}

// GetStudentAttendanceSummary calculates student overall and subject-wise metrics
func GetStudentAttendanceSummary(db *gorm.DB, studentUserID string) (*models.StudentAttendanceSummary, error) {
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		return nil, errors.New("Student profile not found.")
	}

	if student.ClassID == nil || *student.ClassID == "" {
		return &models.StudentAttendanceSummary{
			OverallPercentage: 0.0,
			TotalSessions:     0,
			TotalPresent:      0,
			TotalLate:         0,
			TotalAbsent:       0,
			LatePercentage:    0.0,
			Subjects:          []models.SubjectAttendanceStat{},
		}, nil
	}

	// 1. Get distinct subjects taught to this class
	type subjectItem struct {
		ID   string
		Name string
		Code string
	}
	var classSubjects []subjectItem
	subQuery := `
		SELECT DISTINCT s.id, s.name, s.code
		FROM teacher_subject_classes tsc
		JOIN subjects s ON tsc.subject_id = s.id
		WHERE tsc.class_id = ?
		ORDER BY s.name ASC
	`
	if err := db.Raw(subQuery, *student.ClassID).Scan(&classSubjects).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch class subjects: %w", err)
	}

	subjectsSummary := make([]models.SubjectAttendanceStat, len(classSubjects))
	var totalAllSessions int64 = 0
	var totalAllPresent int64 = 0
	var totalAllLate int64 = 0

	for i, sub := range classSubjects {
		// Total sessions held for this class & subject
		var totalSubSessions int64
		db.Model(&models.AttendanceSession{}).
			Where("class_id = ? AND subject_id = ?", *student.ClassID, sub.ID).
			Count(&totalSubSessions)

		// Sessions student was present for
		var presentSubSessions int64
		db.Table("attendance a").
			Joins("JOIN attendance_sessions s ON a.session_id = s.id").
			Where("a.student_id = ? AND s.subject_id = ? AND a.status = 'PRESENT'", student.ID, sub.ID).
			Count(&presentSubSessions)

		// Sessions student was late for
		var lateSubSessions int64
		db.Table("attendance a").
			Joins("JOIN attendance_sessions s ON a.session_id = s.id").
			Where("a.student_id = ? AND s.subject_id = ? AND a.status = 'LATE'", student.ID, sub.ID).
			Count(&lateSubSessions)

		attendedSubSessions := presentSubSessions + lateSubSessions
		subPct := 0.0
		if totalSubSessions > 0 {
			subPct = math.Round((float64(attendedSubSessions)/float64(totalSubSessions))*1000) / 10
		}
		subLatePct := 0.0
		if totalSubSessions > 0 {
			subLatePct = math.Round((float64(lateSubSessions)/float64(totalSubSessions))*1000) / 10
		}

		absentSubSessions := int64(0)
		if totalSubSessions > attendedSubSessions {
			absentSubSessions = totalSubSessions - attendedSubSessions
		}

		totalAllSessions += totalSubSessions
		totalAllPresent += presentSubSessions
		totalAllLate += lateSubSessions

		subjectsSummary[i] = models.SubjectAttendanceStat{
			SubjectID:       sub.ID,
			SubjectName:     sub.Name,
			SubjectCode:     sub.Code,
			PresentSessions: presentSubSessions,
			LateSessions:    lateSubSessions,
			AbsentSessions:  absentSubSessions,
			TotalSessions:   totalSubSessions,
			Percentage:      subPct,
			LatePercentage:  subLatePct,
		}
	}

	totalAllAttended := totalAllPresent + totalAllLate
	overallPct := 0.0
	if totalAllSessions > 0 {
		overallPct = math.Round((float64(totalAllAttended)/float64(totalAllSessions))*1000) / 10
	}
	overallLatePct := 0.0
	if totalAllSessions > 0 {
		overallLatePct = math.Round((float64(totalAllLate)/float64(totalAllSessions))*1000) / 10
	}

	totalAllAbsent := int64(0)
	if totalAllSessions > totalAllAttended {
		totalAllAbsent = totalAllSessions - totalAllAttended
	}

	return &models.StudentAttendanceSummary{
		OverallPercentage: overallPct,
		TotalSessions:     totalAllSessions,
		TotalPresent:      totalAllPresent,
		TotalLate:         totalAllLate,
		TotalAbsent:       totalAllAbsent,
		LatePercentage:    overallLatePct,
		Subjects:          subjectsSummary,
	}, nil
}

// GetStudentRecentAttendance retrieves recent attendance records for a student
func GetStudentRecentAttendance(db *gorm.DB, studentUserID string) ([]models.StudentRecentAttendanceItem, error) {
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		return nil, errors.New("Student profile not found.")
	}

	type recentRow struct {
		SessionID   string
		SubjectName string
		SubjectCode string
		ClassName   string
		MarkedAt    time.Time
		Status      string
	}

	var rows []recentRow
	query := `
		SELECT 
			a.session_id,
			s.name AS subject_name,
			s.code AS subject_code,
			c.name AS class_name,
			a.marked_at,
			a.status
		FROM attendance a
		JOIN attendance_sessions ses ON a.session_id = ses.id
		JOIN subjects s ON ses.subject_id = s.id
		JOIN classes c ON ses.class_id = c.id
		WHERE a.student_id = ?
		ORDER BY a.marked_at DESC
		LIMIT 10
	`

	if err := db.Raw(query, student.ID).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch recent attendance: %w", err)
	}

	results := make([]models.StudentRecentAttendanceItem, len(rows))
	for i, r := range rows {
		results[i] = models.StudentRecentAttendanceItem{
			SessionID:   r.SessionID,
			SubjectName: r.SubjectName,
			SubjectCode: r.SubjectCode,
			ClassName:   r.ClassName,
			MarkedAt:    r.MarkedAt,
			Status:      r.Status,
		}
	}

	return results, nil
}

// GetStudentAttendanceCalendar retrieves month-by-month attendance data grouped by calendar date
func GetStudentAttendanceCalendar(db *gorm.DB, studentUserID string, monthStr string, subjectID string) (*models.StudentCalendarResponse, error) {
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		return nil, errors.New("Student profile not found.")
	}

	// Parse month (default to current UTC month if blank or invalid)
	cleanMonth := strings.TrimSpace(monthStr)
	if cleanMonth == "" {
		cleanMonth = time.Now().UTC().Format("2006-01")
	}
	tMonth, err := time.Parse("2006-01", cleanMonth)
	if err != nil {
		cleanMonth = time.Now().UTC().Format("2006-01")
		tMonth, _ = time.Parse("2006-01", cleanMonth)
	}

	startOfMonth := time.Date(tMonth.Year(), tMonth.Month(), 1, 0, 0, 0, 0, time.UTC)
	startOfNextMonth := startOfMonth.AddDate(0, 1, 0)

	if student.ClassID == nil || *student.ClassID == "" {
		return &models.StudentCalendarResponse{
			Month: cleanMonth,
			Summary: models.StudentCalendarSummary{
				SessionsHeld:   0,
				Present:        0,
				Late:           0,
				Absent:         0,
				Percentage:     0.0,
				LatePercentage: 0.0,
			},
			Days: []models.StudentCalendarDay{},
		}, nil
	}

	// Fetch all AttendanceSessions held for the student's Class in this month
	query := db.Model(&models.AttendanceSession{}).
		Preload("Subject").
		Where("class_id = ? AND started_at >= ? AND started_at < ?", *student.ClassID, startOfMonth, startOfNextMonth)

	if strings.TrimSpace(subjectID) != "" {
		query = query.Where("subject_id = ?", strings.TrimSpace(subjectID))
	}

	var sessions []models.AttendanceSession
	if err := query.Order("started_at ASC").Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch calendar attendance sessions: %w", err)
	}

	if len(sessions) == 0 {
		return &models.StudentCalendarResponse{
			Month: cleanMonth,
			Summary: models.StudentCalendarSummary{
				SessionsHeld:   0,
				Present:        0,
				Late:           0,
				Absent:         0,
				Percentage:     0.0,
				LatePercentage: 0.0,
			},
			Days: []models.StudentCalendarDay{},
		}, nil
	}

	// Collect session IDs
	sessionIDs := make([]string, len(sessions))
	for i, s := range sessions {
		sessionIDs[i] = s.ID
	}

	// Fetch student's attendance records for these sessions in a single query
	var attendances []models.Attendance
	if err := db.Where("student_id = ? AND session_id IN ?", student.ID, sessionIDs).
		Find(&attendances).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch student attendance logs: %w", err)
	}

	// Map session_id -> Attendance
	attMap := make(map[string]models.Attendance, len(attendances))
	for _, a := range attendances {
		attMap[a.SessionID] = a
	}

	// Group sessions by date YYYY-MM-DD
	dayMap := make(map[string][]models.StudentCalendarSessionItem)
	var totalHeld int64 = 0
	var totalPresent int64 = 0
	var totalLate int64 = 0
	var totalAbsent int64 = 0

	for _, s := range sessions {
		dateKey := s.StartedAt.Format("2006-01-02")
		totalHeld++

		att, found := attMap[s.ID]
		var sessionItem models.StudentCalendarSessionItem
		if found && att.Status == models.StatusPresent {
			totalPresent++
			markedAt := att.MarkedAt
			sessionItem = models.StudentCalendarSessionItem{
				SessionID:   s.ID,
				SubjectID:   s.SubjectID,
				SubjectName: s.Subject.Name,
				SubjectCode: s.Subject.Code,
				Status:      models.StatusPresent,
				MarkedAt:    &markedAt,
				StartedAt:   s.StartedAt,
			}
		} else if found && att.Status == models.StatusLate {
			totalLate++
			markedAt := att.MarkedAt
			sessionItem = models.StudentCalendarSessionItem{
				SessionID:   s.ID,
				SubjectID:   s.SubjectID,
				SubjectName: s.Subject.Name,
				SubjectCode: s.Subject.Code,
				Status:      models.StatusLate,
				MarkedAt:    &markedAt,
				StartedAt:   s.StartedAt,
			}
		} else {
			totalAbsent++
			sessionItem = models.StudentCalendarSessionItem{
				SessionID:   s.ID,
				SubjectID:   s.SubjectID,
				SubjectName: s.Subject.Name,
				SubjectCode: s.Subject.Code,
				Status:      models.StatusAbsent,
				MarkedAt:    nil,
				StartedAt:   s.StartedAt,
			}
		}

		dayMap[dateKey] = append(dayMap[dateKey], sessionItem)
	}

	// Sort unique dates
	uniqueDates := make([]string, 0, len(dayMap))
	for d := range dayMap {
		uniqueDates = append(uniqueDates, d)
	}
	sort.Strings(uniqueDates)

	days := make([]models.StudentCalendarDay, len(uniqueDates))
	for i, d := range uniqueDates {
		sessionItems := dayMap[d]
		presentCount := 0
		lateCount := 0
		absentCount := 0
		for _, it := range sessionItems {
			if it.Status == models.StatusPresent {
				presentCount++
			} else if it.Status == models.StatusLate {
				lateCount++
			} else {
				absentCount++
			}
		}

		attendedCount := presentCount + lateCount
		dayStatus := "PRESENT"
		if attendedCount > 0 && absentCount > 0 {
			dayStatus = "PARTIAL"
		} else if absentCount > 0 && attendedCount == 0 {
			dayStatus = "ABSENT"
		} else if absentCount == 0 && lateCount > 0 && presentCount == 0 {
			dayStatus = "LATE"
		} else {
			dayStatus = "PRESENT"
		}

		days[i] = models.StudentCalendarDay{
			Date:     d,
			Status:   dayStatus,
			Sessions: sessionItems,
		}
	}

	totalAttended := totalPresent + totalLate
	pct := 0.0
	if totalHeld > 0 {
		pct = math.Round((float64(totalAttended)/float64(totalHeld))*1000) / 10
	}
	latePct := 0.0
	if totalHeld > 0 {
		latePct = math.Round((float64(totalLate)/float64(totalHeld))*1000) / 10
	}

	return &models.StudentCalendarResponse{
		Month: cleanMonth,
		Summary: models.StudentCalendarSummary{
			SessionsHeld:   totalHeld,
			Present:        totalPresent,
			Late:           totalLate,
			Absent:         totalAbsent,
			Percentage:     pct,
			LatePercentage: latePct,
		},
		Days: days,
	}, nil
}

// GetStudentAttendanceHistory retrieves paginated and filtered attendance history for a student
func GetStudentAttendanceHistory(
	db *gorm.DB,
	studentUserID string,
	subjectID string,
	statusFilter string,
	fromDate string,
	toDate string,
	searchQuery string,
	page int,
	limit int,
) (*models.StudentAttendanceHistoryResponse, error) {
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		return nil, errors.New("Student profile not found.")
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}

	if student.ClassID == nil || *student.ClassID == "" {
		return &models.StudentAttendanceHistoryResponse{
			Records: []models.StudentAttendanceHistoryRecord{},
			Pagination: models.StudentAttendanceHistoryPagination{
				Page:         page,
				Limit:        limit,
				TotalRecords: 0,
				TotalPages:   0,
			},
			Summary: models.StudentAttendanceHistorySummary{
				Total:          0,
				Present:        0,
				Late:           0,
				Absent:         0,
				Percentage:     0.0,
				LatePercentage: 0.0,
			},
		}, nil
	}

	// 1. Build base WHERE clause for the student's class sessions
	baseQuery := `
		FROM attendance_sessions ses
		JOIN subjects s ON ses.subject_id = s.id
		JOIN classes c ON ses.class_id = c.id
		LEFT JOIN attendance a ON a.session_id = ses.id AND a.student_id = ?
		WHERE ses.class_id = ?
	`
	args := []interface{}{student.ID, *student.ClassID}

	if strings.TrimSpace(subjectID) != "" {
		baseQuery += " AND ses.subject_id = ?"
		args = append(args, strings.TrimSpace(subjectID))
	}

	if strings.TrimSpace(fromDate) != "" {
		baseQuery += " AND DATE(ses.started_at) >= ?"
		args = append(args, strings.TrimSpace(fromDate))
	}

	if strings.TrimSpace(toDate) != "" {
		baseQuery += " AND DATE(ses.started_at) <= ?"
		args = append(args, strings.TrimSpace(toDate))
	}

	if strings.TrimSpace(searchQuery) != "" {
		searchPattern := "%" + strings.ToLower(strings.TrimSpace(searchQuery)) + "%"
		baseQuery += " AND (LOWER(s.name) LIKE ? OR LOWER(s.code) LIKE ?)"
		args = append(args, searchPattern, searchPattern)
	}

	cleanStatus := strings.ToUpper(strings.TrimSpace(statusFilter))
	if cleanStatus == "PRESENT" {
		baseQuery += " AND a.id IS NOT NULL AND a.status = 'PRESENT'"
	} else if cleanStatus == "LATE" {
		baseQuery += " AND a.id IS NOT NULL AND a.status = 'LATE'"
	} else if cleanStatus == "ABSENT" {
		baseQuery += " AND (a.id IS NULL OR a.status = 'ABSENT')"
	}

	// 2. Count total matching records and present/late count for summary
	type summaryCounts struct {
		TotalCount   int64 `gorm:"column:total_count"`
		PresentCount int64 `gorm:"column:present_count"`
		LateCount    int64 `gorm:"column:late_count"`
	}
	var counts summaryCounts
	summarySQL := `
		SELECT 
			COUNT(*) AS total_count,
			COUNT(CASE WHEN a.id IS NOT NULL AND a.status = 'PRESENT' THEN 1 END) AS present_count,
			COUNT(CASE WHEN a.id IS NOT NULL AND a.status = 'LATE' THEN 1 END) AS late_count
	` + baseQuery

	if err := db.Raw(summarySQL, args...).Scan(&counts).Error; err != nil {
		return nil, fmt.Errorf("failed to compute history summary: %w", err)
	}

	totalRecords := counts.TotalCount
	totalPages := 0
	if totalRecords > 0 {
		totalPages = int(math.Ceil(float64(totalRecords) / float64(limit)))
	}

	totalPresent := counts.PresentCount
	totalLate := counts.LateCount
	totalAttended := totalPresent + totalLate
	totalAbsent := int64(0)
	if totalRecords > totalAttended {
		totalAbsent = totalRecords - totalAttended
	}

	pct := 0.0
	if totalRecords > 0 {
		pct = math.Round((float64(totalAttended)/float64(totalRecords))*1000) / 10
	}
	latePct := 0.0
	if totalRecords > 0 {
		latePct = math.Round((float64(totalLate)/float64(totalRecords))*1000) / 10
	}

	summary := models.StudentAttendanceHistorySummary{
		Total:          totalRecords,
		Present:        totalPresent,
		Late:           totalLate,
		Absent:         totalAbsent,
		Percentage:     pct,
		LatePercentage: latePct,
	}

	if totalRecords == 0 {
		return &models.StudentAttendanceHistoryResponse{
			Records: []models.StudentAttendanceHistoryRecord{},
			Pagination: models.StudentAttendanceHistoryPagination{
				Page:         page,
				Limit:        limit,
				TotalRecords: 0,
				TotalPages:   0,
			},
			Summary: summary,
		}, nil
	}

	// 3. Fetch paginated records
	offset := (page - 1) * limit
	selectSQL := `
		SELECT 
			ses.id AS session_id,
			ses.subject_id,
			s.name AS subject_name,
			s.code AS subject_code,
			c.id AS class_id,
			c.name AS class_name,
			ses.started_at,
			ses.expires_at AS ended_at,
			CASE 
				WHEN a.id IS NOT NULL AND a.status = 'LATE' THEN 'LATE'
				WHEN a.id IS NOT NULL AND a.status = 'PRESENT' THEN 'PRESENT' 
				ELSE 'ABSENT' 
			END AS status,
			a.marked_at
	` + baseQuery + `
		ORDER BY ses.started_at DESC
		LIMIT ? OFFSET ?
	`
	pagedArgs := append(args, limit, offset)

	type rowItem struct {
		SessionID   string
		SubjectID   string
		SubjectName string
		SubjectCode string
		ClassID     string
		ClassName   string
		StartedAt   time.Time
		EndedAt     time.Time
		Status      string
		MarkedAt    *time.Time
	}

	var rows []rowItem
	if err := db.Raw(selectSQL, pagedArgs...).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance history records: %w", err)
	}

	records := make([]models.StudentAttendanceHistoryRecord, len(rows))
	for i, r := range rows {
		records[i] = models.StudentAttendanceHistoryRecord{
			SessionID:   r.SessionID,
			SubjectID:   r.SubjectID,
			SubjectName: r.SubjectName,
			SubjectCode: r.SubjectCode,
			ClassID:     r.ClassID,
			ClassName:   r.ClassName,
			StartedAt:   r.StartedAt,
			EndedAt:     r.EndedAt,
			Status:      r.Status,
			MarkedAt:    r.MarkedAt,
		}
	}

	return &models.StudentAttendanceHistoryResponse{
		Records: records,
		Pagination: models.StudentAttendanceHistoryPagination{
			Page:         page,
			Limit:        limit,
			TotalRecords: totalRecords,
			TotalPages:   totalPages,
		},
		Summary: summary,
	}, nil
}

// ==============================================================================
// ADMIN ATTENDANCE SERVICES
// ==============================================================================

// GetAdminAttendanceSessions retrieves all college attendance sessions with optional filtering
func GetAdminAttendanceSessions(db *gorm.DB, dateFilter, subjectFilter, classFilter string) ([]models.AttendanceSessionResponse, error) {
	var sessions []models.AttendanceSession
	query := db.Preload("Teacher.User").Preload("Subject").Preload("Class")

	if strings.TrimSpace(subjectFilter) != "" {
		query = query.Where("subject_id = ?", strings.TrimSpace(subjectFilter))
	}
	if strings.TrimSpace(classFilter) != "" {
		query = query.Where("class_id = ?", strings.TrimSpace(classFilter))
	}
	if strings.TrimSpace(dateFilter) != "" {
		query = query.Where("DATE(started_at) = ?", strings.TrimSpace(dateFilter))
	}

	if err := query.Order("started_at DESC").Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to retrieve attendance sessions: %w", err)
	}

	now := time.Now().UTC()
	results := make([]models.AttendanceSessionResponse, len(sessions))

	for i, s := range sessions {
		var presentCount int64
		db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'PRESENT'", s.ID).Count(&presentCount)

		var lateCount int64
		db.Model(&models.Attendance{}).Where("session_id = ? AND status = 'LATE'", s.ID).Count(&lateCount)

		var totalStudents int64
		db.Model(&models.Student{}).Where("class_id = ?", s.ClassID).Count(&totalStudents)

		attendedCount := presentCount + lateCount
		pct := 0.0
		if totalStudents > 0 {
			pct = math.Round((float64(attendedCount)/float64(totalStudents))*1000) / 10
		}
		latePct := 0.0
		if totalStudents > 0 {
			latePct = math.Round((float64(lateCount)/float64(totalStudents))*1000) / 10
		}

		isExpired := now.After(s.ExpiresAt)
		duration := computeDurationMinutes(s.StartedAt, s.ExpiresAt)
		absentCount := computeAbsentCount(totalStudents, attendedCount)
		sessionStatus := computeSessionStatus(s.IsActive, isExpired)

		lateThresh := s.LateThresholdMinutes
		if lateThresh < 0 {
			lateThresh = 10
		}
		lateAfter := s.StartedAt.Add(time.Duration(lateThresh) * time.Minute)

		results[i] = models.AttendanceSessionResponse{
			ID:                   s.ID,
			TeacherID:            s.TeacherID,
			TeacherName:          s.Teacher.User.Name,
			TeacherEmployeeID:    s.Teacher.EmployeeID,
			SubjectID:            s.SubjectID,
			SubjectName:          s.Subject.Name,
			SubjectCode:          s.Subject.Code,
			ClassID:              s.ClassID,
			ClassName:            s.Class.Name,
			Department:           s.Class.Department,
			Semester:             s.Class.Semester,
			Section:              s.Class.Section,
			AcademicYear:         s.Class.AcademicYear,
			SessionToken:         s.SessionToken,
			StartedAt:            s.StartedAt,
			ExpiresAt:            s.ExpiresAt,
			DurationMinutes:      duration,
			LateThresholdMinutes: lateThresh,
			LateAfter:            lateAfter,
			IsActive:             s.IsActive,
			IsExpired:            isExpired,
			PresentCount:         presentCount,
			LateCount:            lateCount,
			AbsentCount:          absentCount,
			TotalStudents:        totalStudents,
			Percentage:           pct,
			LatePercentage:       latePct,
			Status:               sessionStatus,
			CreatedAt:            s.CreatedAt,
		}
	}

	return results, nil
}

// GetStudentAttendanceAnalytics computes comprehensive analytics, trends, projections, and breakdowns for a student
func GetStudentAttendanceAnalytics(
	db *gorm.DB,
	studentUserID string,
	subjectIDFilter *string,
	fromDate *string,
	toDate *string,
) (*models.StudentAttendanceAnalyticsResponse, error) {
	// 1. Resolve student profile and verify active state
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Student profile not found.")
		}
		return nil, err
	}

	if student.ClassID == nil || strings.TrimSpace(*student.ClassID) == "" {
		return &models.StudentAttendanceAnalyticsResponse{
			Summary: models.StudentAttendanceAnalyticsSummary{
				OverallPercentage:        0.0,
				TotalSessions:            0,
				TotalPresent:             0,
				TotalLate:                0,
				TotalAbsent:              0,
				LatePercentage:           0.0,
				TotalSubjects:            0,
				SubjectsBelowRequirement: 0,
				SubjectsCritical:         0,
				MinThreshold:             75.0,
				CriticalThreshold:        60.0,
			},
			Trend: models.StudentAttendanceTrend{
				Status:                     "INSUFFICIENT_DATA",
				DifferencePercentagePoints: 0.0,
			},
			Projection: models.StudentAttendanceProjection{
				RequiredPercentage:   75.0,
				ClassesNeeded:        nil,
				IsMeetingRequirement: false,
			},
			Monthly:    []models.StudentAttendanceMonthlyStat{},
			Subjects:   []models.StudentAttendanceAnalyticsSubject{},
			Comparison: models.StudentAttendanceComparison{},
			Absence: models.StudentAttendanceAbsenceAnalysis{
				TotalAbsent:       0,
				AbsencePercentage: 0.0,
			},
			Filters: models.StudentAttendanceAnalyticsFilterInfo{
				SubjectID: subjectIDFilter,
				From:      fromDate,
				To:        toDate,
			},
		}, nil
	}

	classID := *student.ClassID

	// 2. Fetch distinct subjects taught to this class (curriculum)
	type subjectItem struct {
		ID   string
		Name string
		Code string
	}
	var classSubjects []subjectItem
	subQuery := `
		SELECT DISTINCT s.id, s.name, s.code
		FROM teacher_subject_classes tsc
		JOIN subjects s ON tsc.subject_id = s.id
		WHERE tsc.class_id = ?
		ORDER BY s.name ASC
	`
	if err := db.Raw(subQuery, classID).Scan(&classSubjects).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch class subjects: %w", err)
	}

	// Validate subject filter if provided: must be in student's class curriculum
	var activeSubjectFilter *string
	if subjectIDFilter != nil && strings.TrimSpace(*subjectIDFilter) != "" {
		cleanSubID := strings.TrimSpace(*subjectIDFilter)
		found := false
		for _, s := range classSubjects {
			if s.ID == cleanSubID {
				found = true
				break
			}
		}
		if !found {
			return nil, errors.New("Subject not found or access denied for your class.")
		}
		activeSubjectFilter = &cleanSubID
	}

	// 3. Query all attendance sessions for this class (with filters)
	type sessionRow struct {
		ID        string
		SubjectID string
		StartedAt time.Time
	}
	var sessions []sessionRow
	sessQuery := db.Table("attendance_sessions").
		Select("id, subject_id, started_at").
		Where("class_id = ?", classID)

	if activeSubjectFilter != nil {
		sessQuery = sessQuery.Where("subject_id = ?", *activeSubjectFilter)
	}
	if fromDate != nil && strings.TrimSpace(*fromDate) != "" {
		sessQuery = sessQuery.Where("DATE(started_at) >= ?", strings.TrimSpace(*fromDate))
	}
	if toDate != nil && strings.TrimSpace(*toDate) != "" {
		sessQuery = sessQuery.Where("DATE(started_at) <= ?", strings.TrimSpace(*toDate))
	}

	if err := sessQuery.Order("started_at ASC").Scan(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance sessions: %w", err)
	}

	// 4. Fetch all attendance records for this student for these sessions
	sessionIDs := make([]string, len(sessions))
	for i, s := range sessions {
		sessionIDs[i] = s.ID
	}

	type studentAttRow struct {
		SessionID string
		Status    string
	}
	var attendedRecords []studentAttRow
	attStatusMap := make(map[string]string)
	if len(sessionIDs) > 0 {
		if err := db.Table("attendance").
			Select("session_id, status").
			Where("student_id = ? AND session_id IN ?", student.ID, sessionIDs).
			Scan(&attendedRecords).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch student attendance records: %w", err)
		}
		for _, ar := range attendedRecords {
			attStatusMap[ar.SessionID] = ar.Status
		}
	}

	// 5. In-Memory Aggregations
	var totalSessions int64 = int64(len(sessions))
	var totalPresent int64 = 0
	var totalLate int64 = 0

	// Subject stats map: subjectID -> (total, present, late)
	type subStat struct {
		Total   int64
		Present int64
		Late    int64
	}
	subjectStatsMap := make(map[string]*subStat)
	for _, s := range classSubjects {
		subjectStatsMap[s.ID] = &subStat{Total: 0, Present: 0, Late: 0}
	}

	// Monthly stats map: "YYYY-MM" -> (total, present, late)
	monthlyStatsMap := make(map[string]*subStat)

	for _, s := range sessions {
		monthKey := s.StartedAt.UTC().Format("2006-01")
		if _, ok := monthlyStatsMap[monthKey]; !ok {
			monthlyStatsMap[monthKey] = &subStat{Total: 0, Present: 0, Late: 0}
		}
		monthlyStatsMap[monthKey].Total++

		if stat, ok := subjectStatsMap[s.SubjectID]; ok {
			stat.Total++
		}

		if status, attended := attStatusMap[s.ID]; attended {
			if status == models.StatusLate {
				totalLate++
				monthlyStatsMap[monthKey].Late++
				if stat, ok := subjectStatsMap[s.SubjectID]; ok {
					stat.Late++
				}
			} else if status == models.StatusPresent {
				totalPresent++
				monthlyStatsMap[monthKey].Present++
				if stat, ok := subjectStatsMap[s.SubjectID]; ok {
					stat.Present++
				}
			}
		}
	}

	totalAttended := totalPresent + totalLate
	var totalAbsent int64 = 0
	if totalSessions > totalAttended {
		totalAbsent = totalSessions - totalAttended
	}

	overallPct := 0.0
	if totalSessions > 0 {
		overallPct = math.Round((float64(totalAttended)/float64(totalSessions))*1000) / 10
	}
	overallLatePct := 0.0
	if totalSessions > 0 {
		overallLatePct = math.Round((float64(totalLate)/float64(totalSessions))*1000) / 10
	}

	absencePct := 0.0
	if totalSessions > 0 {
		absencePct = math.Round((float64(totalAbsent)/float64(totalSessions))*1000) / 10
	}

	// 6. Build Subject Analytics list
	var subjectsAnalytics []models.StudentAttendanceAnalyticsSubject
	subjectsBelowReq := 0
	subjectsCritical := 0
	subjectsMeeting := 0

	var bestSubjectID *string
	var bestSubjectName string
	var bestSubjectPct *float64
	var lowestSubjectID *string
	var lowestSubjectName string
	var lowestSubjectPct *float64

	var highestAbsenceSubID *string
	var highestAbsenceSubName string
	var highestAbsenceCount int64 = 0
	subjectsAffectedByAbsence := 0

	// Filter classSubjects if subject filter is active
	var targetSubjects []subjectItem
	if activeSubjectFilter != nil {
		for _, s := range classSubjects {
			if s.ID == *activeSubjectFilter {
				targetSubjects = append(targetSubjects, s)
				break
			}
		}
	} else {
		targetSubjects = classSubjects
	}

	for _, s := range targetSubjects {
		st := subjectStatsMap[s.ID]
		subTotal := int64(0)
		subPresent := int64(0)
		subLate := int64(0)
		if st != nil {
			subTotal = st.Total
			subPresent = st.Present
			subLate = st.Late
		}
		subAttended := subPresent + subLate
		subAbsent := int64(0)
		if subTotal > subAttended {
			subAbsent = subTotal - subAttended
		}

		subPct := 0.0
		if subTotal > 0 {
			subPct = math.Round((float64(subAttended)/float64(subTotal))*1000) / 10
		}
		subLatePct := 0.0
		if subTotal > 0 {
			subLatePct = math.Round((float64(subLate)/float64(subTotal))*1000) / 10
		}

		status := "REQUIREMENT_MET"
		if subTotal > 0 {
			if subPct >= 75.0 {
				status = "REQUIREMENT_MET"
				subjectsMeeting++
			} else if subPct >= 60.0 {
				status = "BELOW_REQUIREMENT"
				subjectsBelowReq++
			} else {
				status = "CRITICAL"
				subjectsCritical++
				subjectsBelowReq++ // also counted in below 75%
			}
		} else {
			subjectsMeeting++
		}

		if subAbsent > 0 {
			subjectsAffectedByAbsence++
			if subAbsent > highestAbsenceCount {
				highestAbsenceCount = subAbsent
				highestAbsenceSubID = &s.ID
				highestAbsenceSubName = s.Name
			}
		}

		if subTotal > 0 {
			if bestSubjectPct == nil || subPct > *bestSubjectPct {
				subPctCopy := subPct
				bestSubjectPct = &subPctCopy
				bestSubjectID = &s.ID
				bestSubjectName = s.Name
			}
			if lowestSubjectPct == nil || subPct < *lowestSubjectPct {
				subPctCopy := subPct
				lowestSubjectPct = &subPctCopy
				lowestSubjectID = &s.ID
				lowestSubjectName = s.Name
			}
		}

		subjectsAnalytics = append(subjectsAnalytics, models.StudentAttendanceAnalyticsSubject{
			SubjectID:       s.ID,
			SubjectName:     s.Name,
			SubjectCode:     s.Code,
			TotalSessions:   subTotal,
			PresentSessions: subPresent,
			LateSessions:    subLate,
			AbsentSessions:  subAbsent,
			Percentage:      subPct,
			LatePercentage:  subLatePct,
			Status:          status,
		})
	}

	// 7. Build Monthly Analytics
	var monthsList []string
	for m := range monthlyStatsMap {
		monthsList = append(monthsList, m)
	}
	sort.Strings(monthsList)

	monthlyStats := make([]models.StudentAttendanceMonthlyStat, len(monthsList))
	for i, m := range monthsList {
		st := monthlyStatsMap[m]
		mAttended := st.Present + st.Late
		mAbsent := int64(0)
		if st.Total > mAttended {
			mAbsent = st.Total - mAttended
		}
		mPct := 0.0
		if st.Total > 0 {
			mPct = math.Round((float64(mAttended)/float64(st.Total))*1000) / 10
		}
		mLatePct := 0.0
		if st.Total > 0 {
			mLatePct = math.Round((float64(st.Late)/float64(st.Total))*1000) / 10
		}
		monthlyStats[i] = models.StudentAttendanceMonthlyStat{
			Month:          m,
			Sessions:       st.Total,
			Present:        st.Present,
			Late:           st.Late,
			Absent:         mAbsent,
			Percentage:     mPct,
			LatePercentage: mLatePct,
		}
	}

	// 8. Calculate Trend
	trendStatus := "INSUFFICIENT_DATA"
	var diffPctPoints float64 = 0.0
	var prevMonthPct *float64
	var currMonthPct *float64

	if len(monthlyStats) >= 2 {
		curr := monthlyStats[len(monthlyStats)-1].Percentage
		prev := monthlyStats[len(monthlyStats)-2].Percentage
		currMonthPct = &curr
		prevMonthPct = &prev
		diff := curr - prev
		diffPctPoints = math.Round(diff*10) / 10

		if diff >= 2.0 {
			trendStatus = "IMPROVING"
		} else if diff <= -2.0 {
			trendStatus = "DECLINING"
		} else {
			trendStatus = "STABLE"
		}
	} else if len(monthlyStats) == 1 {
		curr := monthlyStats[0].Percentage
		currMonthPct = &curr
		trendStatus = "INSUFFICIENT_DATA"
	}

	// 9. Calculate 75% Requirement Projection
	// Smallest non-negative integer x such that:
	// (P + x) / (T + x) >= 0.75 <=> 4(P + x) >= 3(T + x) <=> x >= 3T - 4P
	var classesNeeded *int
	isMeeting := false

	if totalSessions > 0 {
		if overallPct >= 75.0 {
			zero := 0
			classesNeeded = &zero
			isMeeting = true
		} else {
			val := int(3*totalSessions - 4*totalAttended)
			if val < 0 {
				val = 0
			}
			classesNeeded = &val
			isMeeting = false
		}
	}

	totalSubjectsCount := int64(len(targetSubjects))

	return &models.StudentAttendanceAnalyticsResponse{
		Summary: models.StudentAttendanceAnalyticsSummary{
			OverallPercentage:        overallPct,
			TotalSessions:            totalSessions,
			TotalPresent:             totalPresent,
			TotalLate:                totalLate,
			TotalAbsent:              totalAbsent,
			LatePercentage:           overallLatePct,
			TotalSubjects:            totalSubjectsCount,
			SubjectsBelowRequirement: subjectsBelowReq,
			SubjectsCritical:         subjectsCritical,
			MinThreshold:             75.0,
			CriticalThreshold:        60.0,
		},
		Trend: models.StudentAttendanceTrend{
			Status:                     trendStatus,
			DifferencePercentagePoints: diffPctPoints,
			PreviousPercentage:         prevMonthPct,
			CurrentPercentage:          currMonthPct,
		},
		Projection: models.StudentAttendanceProjection{
			RequiredPercentage:   75.0,
			ClassesNeeded:        classesNeeded,
			IsMeetingRequirement: isMeeting,
		},
		Monthly:  monthlyStats,
		Subjects: subjectsAnalytics,
		Comparison: models.StudentAttendanceComparison{
			BestSubjectID:              bestSubjectID,
			BestSubjectName:            bestSubjectName,
			BestPercentage:             bestSubjectPct,
			LowestSubjectID:            lowestSubjectID,
			LowestSubjectName:          lowestSubjectName,
			LowestPercentage:           lowestSubjectPct,
			SubjectsMeetingRequirement: subjectsMeeting,
			SubjectsBelowRequirement:   subjectsBelowReq,
			SubjectsCritical:           subjectsCritical,
		},
		Absence: models.StudentAttendanceAbsenceAnalysis{
			TotalAbsent:               totalAbsent,
			AbsencePercentage:         absencePct,
			HighestAbsenceSubjectID:   highestAbsenceSubID,
			HighestAbsenceSubjectName: highestAbsenceSubName,
			HighestAbsenceCount:       highestAbsenceCount,
			SubjectsAffectedCount:     subjectsAffectedByAbsence,
		},
		Filters: models.StudentAttendanceAnalyticsFilterInfo{
			SubjectID: activeSubjectFilter,
			From:      fromDate,
			To:        toDate,
		},
	}, nil
}

// ==============================================================================
// TEACHER STUDENT ATTENDANCE SEARCH & DETAIL SERVICES (Feature #9)
// ==============================================================================

// SearchTeacherStudents performs optimized, authorized student search and attendance aggregation for a teacher
func SearchTeacherStudents(
	db *gorm.DB,
	teacherUserID string,
	query string,
	classIDFilter *string,
	subjectIDFilter *string,
	statusFilter *string,
	fromDate *string,
	toDate *string,
	page int,
	pageSize int,
	sortBy string,
	sortOrder string,
) (*models.TeacherStudentSearchResponse, error) {
	// 1. Resolve teacher record
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher profile not found.")
		}
		return nil, err
	}

	// 2. Fetch all teacher assignments (authorized class_ids and subject_ids)
	type tscRow struct {
		ClassID   string
		SubjectID string
	}
	var assignments []tscRow
	if err := db.Table("teacher_subject_classes").
		Select("class_id, subject_id").
		Where("teacher_id = ?", teacher.ID).
		Scan(&assignments).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher assignments: %w", err)
	}

	if len(assignments) == 0 {
		return &models.TeacherStudentSearchResponse{
			Items: []models.TeacherStudentSearchItem{},
			Pagination: models.TeacherStudentSearchPagination{
				Page:       page,
				PageSize:   pageSize,
				Total:      0,
				TotalPages: 0,
			},
			Summary: models.TeacherStudentSearchSummary{},
		}, nil
	}

	authorizedClassSet := make(map[string]bool)
	authorizedSubjectSet := make(map[string]bool)
	for _, a := range assignments {
		authorizedClassSet[a.ClassID] = true
		authorizedSubjectSet[a.SubjectID] = true
	}

	// Validate class_id filter if provided
	var targetClassIDs []string
	if classIDFilter != nil && strings.TrimSpace(*classIDFilter) != "" {
		cID := strings.TrimSpace(*classIDFilter)
		if !authorizedClassSet[cID] {
			return nil, errors.New("Access denied to class or class not assigned to you.")
		}
		targetClassIDs = []string{cID}
	} else {
		for cID := range authorizedClassSet {
			targetClassIDs = append(targetClassIDs, cID)
		}
	}

	// Validate subject_id filter if provided
	var targetSubjectFilter *string
	if subjectIDFilter != nil && strings.TrimSpace(*subjectIDFilter) != "" {
		sID := strings.TrimSpace(*subjectIDFilter)
		if !authorizedSubjectSet[sID] {
			return nil, errors.New("Access denied to subject or subject not assigned to you.")
		}
		targetSubjectFilter = &sID
	}

	// 3. Query all candidate students enrolled in these target classes matching search term
	type studentRow struct {
		ID         string
		UserID     string
		Name       string
		RollNumber string
		Email      string
		ClassID    string
		ClassName  string
		Department string
		Semester   int
		Section    string
		CreatedAt  time.Time
	}

	studQuery := db.Table("students s").
		Select(`
			s.id,
			s.user_id,
			u.name,
			s.roll_number,
			u.email,
			s.class_id,
			c.name AS class_name,
			c.department,
			c.semester,
			c.section,
			s.created_at
		`).
		Joins("JOIN users u ON s.user_id = u.id").
		Joins("JOIN classes c ON s.class_id = c.id").
		Where("s.class_id IN ?", targetClassIDs)

	cleanQ := strings.TrimSpace(query)
	if cleanQ != "" {
		likePattern := "%" + strings.ToLower(cleanQ) + "%"
		studQuery = studQuery.Where("(LOWER(u.name) LIKE ? OR LOWER(s.roll_number) LIKE ? OR LOWER(u.email) LIKE ?)", likePattern, likePattern, likePattern)
	}

	var students []studentRow
	if err := studQuery.Scan(&students).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch students: %w", err)
	}

	if len(students) == 0 {
		return &models.TeacherStudentSearchResponse{
			Items: []models.TeacherStudentSearchItem{},
			Pagination: models.TeacherStudentSearchPagination{
				Page:       page,
				PageSize:   pageSize,
				Total:      0,
				TotalPages: 0,
			},
			Summary: models.TeacherStudentSearchSummary{},
		}, nil
	}

	studentIDs := make([]string, len(students))
	for i, st := range students {
		studentIDs[i] = st.ID
	}

	// 4. Batch query all attendance sessions for these classes (with subject/date filters)
	type sessionItem struct {
		ID        string
		ClassID   string
		SubjectID string
	}
	sessQuery := db.Table("attendance_sessions").
		Select("id, class_id, subject_id").
		Where("class_id IN ?", targetClassIDs)

	if targetSubjectFilter != nil {
		sessQuery = sessQuery.Where("subject_id = ?", *targetSubjectFilter)
	}
	if fromDate != nil && strings.TrimSpace(*fromDate) != "" {
		sessQuery = sessQuery.Where("DATE(started_at) >= ?", strings.TrimSpace(*fromDate))
	}
	if toDate != nil && strings.TrimSpace(*toDate) != "" {
		sessQuery = sessQuery.Where("DATE(started_at) <= ?", strings.TrimSpace(*toDate))
	}

	var sessions []sessionItem
	if err := sessQuery.Scan(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance sessions: %w", err)
	}

	// Map sessions per class_id
	classSessionsCountMap := make(map[string]int64)
	sessionIDs := make([]string, len(sessions))
	for i, s := range sessions {
		classSessionsCountMap[s.ClassID]++
		sessionIDs[i] = s.ID
	}

	// 5. Batch query attendance records for all matching students for these sessions
	type attRow struct {
		StudentID string
		SessionID string
		Status    string
	}
	var attendanceRecords []attRow
	if len(sessionIDs) > 0 && len(studentIDs) > 0 {
		if err := db.Table("attendance").
			Select("student_id, session_id, status").
			Where("student_id IN ? AND session_id IN ? AND status IN ('PRESENT', 'LATE')", studentIDs, sessionIDs).
			Scan(&attendanceRecords).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch attendance records: %w", err)
		}
	}

	// Map student_id -> count of present and late sessions
	studentPresentCountMap := make(map[string]int64)
	studentLateCountMap := make(map[string]int64)
	for _, a := range attendanceRecords {
		if a.Status == models.StatusLate {
			studentLateCountMap[a.StudentID]++
		} else {
			studentPresentCountMap[a.StudentID]++
		}
	}

	// 6. Build evaluated items and compute standing status
	var allEvaluatedItems []models.TeacherStudentSearchItem
	var meetingCount, belowCount, criticalCount int

	for _, st := range students {
		totalSess := classSessionsCountMap[st.ClassID]
		presentSess := studentPresentCountMap[st.ID]
		lateSess := studentLateCountMap[st.ID]
		attendedSess := presentSess + lateSess

		absentSess := int64(0)
		if totalSess > attendedSess {
			absentSess = totalSess - attendedSess
		}

		pct := 0.0
		if totalSess > 0 {
			pct = math.Round((float64(attendedSess)/float64(totalSess))*1000) / 10
		}
		latePct := 0.0
		if totalSess > 0 {
			latePct = math.Round((float64(lateSess)/float64(totalSess))*1000) / 10
		}

		status := "REQUIREMENT_MET"
		if totalSess > 0 {
			if pct >= 75.0 {
				status = "REQUIREMENT_MET"
				meetingCount++
			} else if pct >= 60.0 {
				status = "BELOW_REQUIREMENT"
				belowCount++
			} else {
				status = "CRITICAL"
				criticalCount++
				belowCount++ // also counted in below 75%
			}
		} else {
			status = "REQUIREMENT_MET"
			meetingCount++
		}

		item := models.TeacherStudentSearchItem{
			StudentID:            st.ID,
			UserID:               st.UserID,
			Name:                 st.Name,
			RollNumber:           st.RollNumber,
			Email:                st.Email,
			ClassID:              st.ClassID,
			ClassName:            st.ClassName,
			Department:           st.Department,
			Semester:             st.Semester,
			Section:              st.Section,
			AttendancePercentage: pct,
			Present:              presentSess,
			Late:                 lateSess,
			Absent:               absentSess,
			TotalSessions:        totalSess,
			LatePercentage:       latePct,
			Status:               status,
		}

		// Apply status filter if provided
		if statusFilter != nil && strings.TrimSpace(*statusFilter) != "" {
			sf := strings.ToUpper(strings.TrimSpace(*statusFilter))
			if sf != "ALL" {
				if sf == "LATE" {
					if lateSess == 0 {
						continue
					}
				} else if sf == "PRESENT" {
					if presentSess == 0 {
						continue
					}
				} else if sf == "ABSENT" {
					if absentSess == 0 {
						continue
					}
				} else if sf == "MET" || sf == "REQUIREMENT_MET" {
					if status != "REQUIREMENT_MET" {
						continue
					}
				} else if sf == "LOW" || sf == "BELOW_REQUIREMENT" {
					if status != "BELOW_REQUIREMENT" && status != "CRITICAL" {
						continue
					}
				} else if sf == "CRITICAL" {
					if status != "CRITICAL" {
						continue
					}
				}
			}
		}

		allEvaluatedItems = append(allEvaluatedItems, item)
	}

	// 7. Stable Sort in-memory with allowlist
	cleanSortBy := strings.ToLower(strings.TrimSpace(sortBy))
	if cleanSortBy == "" {
		cleanSortBy = "name"
	}
	isDesc := strings.ToLower(strings.TrimSpace(sortOrder)) == "desc"

	sort.SliceStable(allEvaluatedItems, func(i, j int) bool {
		a, b := allEvaluatedItems[i], allEvaluatedItems[j]
		var cmp int
		switch cleanSortBy {
		case "roll_number":
			cmp = strings.Compare(strings.ToLower(a.RollNumber), strings.ToLower(b.RollNumber))
		case "attendance_percentage", "percentage":
			if a.AttendancePercentage < b.AttendancePercentage {
				cmp = -1
			} else if a.AttendancePercentage > b.AttendancePercentage {
				cmp = 1
			} else {
				cmp = strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
			}
		case "present":
			if a.Present < b.Present {
				cmp = -1
			} else if a.Present > b.Present {
				cmp = 1
			} else {
				cmp = strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
			}
		case "late":
			if a.Late < b.Late {
				cmp = -1
			} else if a.Late > b.Late {
				cmp = 1
			} else {
				cmp = strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
			}
		case "absent":
			if a.Absent < b.Absent {
				cmp = -1
			} else if a.Absent > b.Absent {
				cmp = 1
			} else {
				cmp = strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
			}
		case "name":
			fallthrough
		default:
			cmp = strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
		}

		if isDesc {
			return cmp > 0
		}
		return cmp < 0
	})

	// 8. Pagination calculation
	totalRecords := int64(len(allEvaluatedItems))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	} else if pageSize > 100 {
		pageSize = 100
	}

	totalPages := int(math.Ceil(float64(totalRecords) / float64(pageSize)))
	if totalPages == 0 && totalRecords == 0 {
		totalPages = 0
	}

	startIndex := (page - 1) * pageSize
	if startIndex > len(allEvaluatedItems) {
		startIndex = len(allEvaluatedItems)
	}
	endIndex := startIndex + pageSize
	if endIndex > len(allEvaluatedItems) {
		endIndex = len(allEvaluatedItems)
	}

	pagedItems := allEvaluatedItems[startIndex:endIndex]
	if pagedItems == nil {
		pagedItems = []models.TeacherStudentSearchItem{}
	}

	return &models.TeacherStudentSearchResponse{
		Items: pagedItems,
		Pagination: models.TeacherStudentSearchPagination{
			Page:       page,
			PageSize:   pageSize,
			Total:      totalRecords,
			TotalPages: totalPages,
		},
		Summary: models.TeacherStudentSearchSummary{
			TotalStudents:              totalRecords,
			StudentsMeetingRequirement: meetingCount,
			StudentsBelowRequirement:   belowCount,
			StudentsCritical:           criticalCount,
		},
	}, nil
}

// GetTeacherStudentAttendanceDetail returns student overall attendance, subject performance, and verified session logs
func GetTeacherStudentAttendanceDetail(
	db *gorm.DB,
	teacherUserID string,
	studentID string,
	subjectIDFilter *string,
	statusFilter *string,
	fromDate *string,
	toDate *string,
	page int,
	limit int,
) (*models.TeacherStudentAttendanceDetailResponse, error) {
	// 1. Resolve teacher record
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher profile not found.")
		}
		return nil, err
	}

	// 2. Fetch student profile
	var student models.Student
	if err := db.Preload("User").Preload("Class").Where("id = ?", studentID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Student not found.")
		}
		return nil, err
	}

	if student.ClassID == nil || *student.ClassID == "" {
		return nil, errors.New("Student is not assigned to any academic class.")
	}
	classID := *student.ClassID

	// 3. Verify teacher authorization: Teacher must be assigned to teach this student's class
	var authCount int64
	if err := db.Model(&models.TeacherSubjectClass{}).
		Where("teacher_id = ? AND class_id = ?", teacher.ID, classID).
		Count(&authCount).Error; err != nil {
		return nil, fmt.Errorf("failed to verify teacher authorization: %w", err)
	}

	if authCount == 0 {
		return nil, errors.New("Access denied: You are not authorized to view this student's attendance records.")
	}

	// 4. Fetch distinct subjects taught to this class (curriculum)
	type subjectItem struct {
		ID   string
		Name string
		Code string
	}
	var classSubjects []subjectItem
	subQuery := `
		SELECT DISTINCT s.id, s.name, s.code
		FROM teacher_subject_classes tsc
		JOIN subjects s ON tsc.subject_id = s.id
		WHERE tsc.class_id = ?
		ORDER BY s.name ASC
	`
	if err := db.Raw(subQuery, classID).Scan(&classSubjects).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch class subjects: %w", err)
	}

	// 5. Query all attendance sessions for student's class
	type sessionDetailRow struct {
		ID          string
		SubjectID   string
		SubjectName string
		SubjectCode string
		StartedAt   time.Time
		ExpiresAt   time.Time
	}
	var allSessions []sessionDetailRow
	sQuery := db.Table("attendance_sessions s").
		Select("s.id, s.subject_id, sub.name AS subject_name, sub.code AS subject_code, s.started_at, s.expires_at").
		Joins("JOIN subjects sub ON s.subject_id = sub.id").
		Where("s.class_id = ?", classID)

	if err := sQuery.Order("s.started_at DESC").Scan(&allSessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch sessions: %w", err)
	}

	// 6. Fetch student attendance records for all sessions
	allSessionIDs := make([]string, len(allSessions))
	for i, s := range allSessions {
		allSessionIDs[i] = s.ID
	}

	type attDetailRow struct {
		ID        string
		SessionID string
		MarkedAt  time.Time
		Status    string
	}
	var attRecords []attDetailRow
	if len(allSessionIDs) > 0 {
		if err := db.Table("attendance").
			Select("id, session_id, marked_at, status").
			Where("student_id = ? AND session_id IN ?", student.ID, allSessionIDs).
			Scan(&attRecords).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch student attendance: %w", err)
		}
	}

	attendanceMap := make(map[string]*attDetailRow)
	for i := range attRecords {
		attendanceMap[attRecords[i].SessionID] = &attRecords[i]
	}

	// 7. Calculate Subject-Wise Breakdown
	type subAcc struct {
		Total   int64
		Present int64
		Late    int64
	}
	subjectStatsMap := make(map[string]*subAcc)
	for _, cs := range classSubjects {
		subjectStatsMap[cs.ID] = &subAcc{Total: 0, Present: 0, Late: 0}
	}

	var overallTotal int64 = int64(len(allSessions))
	var overallPresent int64 = 0
	var overallLate int64 = 0

	for _, s := range allSessions {
		if acc, ok := subjectStatsMap[s.SubjectID]; ok {
			acc.Total++
		}
		if att, attended := attendanceMap[s.ID]; attended {
			if att.Status == models.StatusPresent {
				overallPresent++
				if acc, ok := subjectStatsMap[s.SubjectID]; ok {
					acc.Present++
				}
			} else if att.Status == models.StatusLate {
				overallLate++
				if acc, ok := subjectStatsMap[s.SubjectID]; ok {
					acc.Late++
				}
			}
		}
	}

	overallAttended := overallPresent + overallLate
	var overallAbsent int64 = 0
	if overallTotal > overallAttended {
		overallAbsent = overallTotal - overallAttended
	}

	overallPct := 0.0
	if overallTotal > 0 {
		overallPct = math.Round((float64(overallAttended)/float64(overallTotal))*1000) / 10
	}
	overallLatePct := 0.0
	if overallTotal > 0 {
		overallLatePct = math.Round((float64(overallLate)/float64(overallTotal))*1000) / 10
	}

	overallStatus := "REQUIREMENT_MET"
	if overallTotal > 0 {
		if overallPct >= 75.0 {
			overallStatus = "REQUIREMENT_MET"
		} else if overallPct >= 60.0 {
			overallStatus = "BELOW_REQUIREMENT"
		} else {
			overallStatus = "CRITICAL"
		}
	}

	var subjectDetails []models.TeacherStudentAttendanceDetailSubject
	for _, cs := range classSubjects {
		acc := subjectStatsMap[cs.ID]
		sTotal := int64(0)
		sPresent := int64(0)
		sLate := int64(0)
		if acc != nil {
			sTotal = acc.Total
			sPresent = acc.Present
			sLate = acc.Late
		}
		sAttended := sPresent + sLate
		sAbsent := int64(0)
		if sTotal > sAttended {
			sAbsent = sTotal - sAttended
		}
		sPct := 0.0
		if sTotal > 0 {
			sPct = math.Round((float64(sAttended)/float64(sTotal))*1000) / 10
		}
		sLatePct := 0.0
		if sTotal > 0 {
			sLatePct = math.Round((float64(sLate)/float64(sTotal))*1000) / 10
		}
		sStatus := "REQUIREMENT_MET"
		if sTotal > 0 {
			if sPct >= 75.0 {
				sStatus = "REQUIREMENT_MET"
			} else if sPct >= 60.0 {
				sStatus = "BELOW_REQUIREMENT"
			} else {
				sStatus = "CRITICAL"
			}
		}
		subjectDetails = append(subjectDetails, models.TeacherStudentAttendanceDetailSubject{
			SubjectID:      cs.ID,
			SubjectName:    cs.Name,
			SubjectCode:    cs.Code,
			Total:          sTotal,
			Present:        sPresent,
			Late:           sLate,
			Absent:         sAbsent,
			Percentage:     sPct,
			LatePercentage: sLatePct,
			Status:         sStatus,
		})
	}

	// 8. Build History Records with Filters
	var filteredHistoryRecords []models.TeacherStudentAttendanceDetailHistoryRecord
	for _, s := range allSessions {
		// Apply subject filter
		if subjectIDFilter != nil && strings.TrimSpace(*subjectIDFilter) != "" {
			if s.SubjectID != strings.TrimSpace(*subjectIDFilter) {
				continue
			}
		}

		// Apply date range filters
		if fromDate != nil && strings.TrimSpace(*fromDate) != "" {
			if s.StartedAt.Format("2006-01-02") < strings.TrimSpace(*fromDate) {
				continue
			}
		}
		if toDate != nil && strings.TrimSpace(*toDate) != "" {
			if s.StartedAt.Format("2006-01-02") > strings.TrimSpace(*toDate) {
				continue
			}
		}

		recStatus := models.StatusAbsent
		var markedAt *time.Time
		var attID *string
		if att, attended := attendanceMap[s.ID]; attended {
			idCopy := att.ID
			attID = &idCopy
			recStatus = att.Status
			mTime := att.MarkedAt
			markedAt = &mTime
		}

		// Apply status filter
		if statusFilter != nil && strings.TrimSpace(*statusFilter) != "" {
			sf := strings.ToUpper(strings.TrimSpace(*statusFilter))
			if sf != "ALL" && sf != recStatus {
				continue
			}
		}

		filteredHistoryRecords = append(filteredHistoryRecords, models.TeacherStudentAttendanceDetailHistoryRecord{
			AttendanceID: attID,
			SessionID:   s.ID,
			SubjectID:   s.SubjectID,
			SubjectName: s.SubjectName,
			SubjectCode: s.SubjectCode,
			StartedAt:   s.StartedAt,
			EndedAt:     s.ExpiresAt,
			Status:      recStatus,
			MarkedAt:    markedAt,
		})
	}

	// 9. Paginate History Records
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	} else if limit > 100 {
		limit = 100
	}

	totalHistoryRecords := int64(len(filteredHistoryRecords))
	totalHistoryPages := int(math.Ceil(float64(totalHistoryRecords) / float64(limit)))
	if totalHistoryPages == 0 && totalHistoryRecords == 0 {
		totalHistoryPages = 0
	}

	hStart := (page - 1) * limit
	if hStart > len(filteredHistoryRecords) {
		hStart = len(filteredHistoryRecords)
	}
	hEnd := hStart + limit
	if hEnd > len(filteredHistoryRecords) {
		hEnd = len(filteredHistoryRecords)
	}

	pagedHistory := filteredHistoryRecords[hStart:hEnd]
	if pagedHistory == nil {
		pagedHistory = []models.TeacherStudentAttendanceDetailHistoryRecord{}
	}

	className := ""
	dept := student.Department
	sem := student.Semester
	sec := student.Section
	if student.Class != nil {
		className = student.Class.Name
		dept = student.Class.Department
		sem = student.Class.Semester
		sec = student.Class.Section
	}

	return &models.TeacherStudentAttendanceDetailResponse{
		Student: models.TeacherStudentBriefInfo{
			ID:         student.ID,
			UserID:     student.UserID,
			Name:       student.User.Name,
			RollNumber: student.RollNumber,
			Email:      student.User.Email,
			ClassID:    classID,
			ClassName:  className,
			Department: dept,
			Semester:   sem,
			Section:    sec,
		},
		Summary: models.TeacherStudentAttendanceDetailSummary{
			OverallPercentage: overallPct,
			TotalSessions:     overallTotal,
			TotalPresent:      overallPresent,
			TotalLate:         overallLate,
			TotalAbsent:       overallAbsent,
			LatePercentage:    overallLatePct,
			Status:            overallStatus,
		},
		Subjects: subjectDetails,
		History: models.TeacherStudentAttendanceDetailHistory{
			Records: pagedHistory,
			Pagination: models.StudentAttendanceHistoryPagination{
				Page:         page,
				Limit:        limit,
				TotalRecords: totalHistoryRecords,
				TotalPages:   totalHistoryPages,
			},
		},
	}, nil
}

// ==============================================================================
// MANUAL ATTENDANCE & ATTENDANCE CORRECTION SERVICES (Feature #11)
// ==============================================================================

// MarkAttendanceManually marks or updates a student's attendance record with mandatory reason and transactional audit logging
func MarkAttendanceManually(
	db *gorm.DB,
	actorUserID string,
	actorRole string,
	req *models.ManualAttendanceRequest,
) (*models.ManualAttendanceResponse, error) {
	// 1. Validate reason requirements
	cleanReason, err := ValidateAttendanceReason(req.Reason)
	if err != nil {
		return nil, err
	}

	// 2. Validate attendance status
	cleanStatus, err := ValidateAttendanceStatus(req.Status)
	if err != nil {
		return nil, err
	}

	// 3. Validate actor role
	cleanRole := strings.ToUpper(strings.TrimSpace(actorRole))
	if cleanRole != models.RoleTeacher && cleanRole != models.RoleAdmin {
		return nil, errors.New("Only teachers and administrators can manually mark attendance.")
	}

	// 4. Verify student profile
	cleanStudentID := strings.TrimSpace(req.StudentID)
	if cleanStudentID == "" {
		return nil, errors.New("Student ID is required.")
	}
	var student models.Student
	if err := db.Preload("User").Where("id = ?", cleanStudentID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStudentNotFound
		}
		return nil, err
	}
	if !student.User.IsActive {
		return nil, ErrStudentAccountInactive
	}
	if student.ClassID == nil || strings.TrimSpace(*student.ClassID) == "" {
		return nil, ErrStudentNotAssignedClass
	}

	// 5. Verify attendance session
	cleanSessionID := strings.TrimSpace(req.SessionID)
	if cleanSessionID == "" {
		return nil, errors.New("Session ID is required.")
	}
	var session models.AttendanceSession
	if err := db.Preload("Subject").Preload("Class").Where("id = ?", cleanSessionID).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}

	// 6. Verify class alignment: Student must belong to the exact class of the session
	if *student.ClassID != session.ClassID {
		return nil, ErrStudentClassMismatch
	}

	// 7. Verify teacher assignment if actor is TEACHER
	if cleanRole == models.RoleTeacher {
		var teacher models.Teacher
		if err := db.Preload("User").Where("user_id = ?", actorUserID).First(&teacher).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("Teacher profile not found.")
			}
			return nil, err
		}
		if !teacher.User.IsActive {
			return nil, errors.New("Teacher account is inactive.")
		}

		var assignmentCount int64
		if err := db.Model(&models.TeacherSubjectClass{}).
			Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacher.ID, session.SubjectID, session.ClassID).
			Count(&assignmentCount).Error; err != nil {
			return nil, fmt.Errorf("failed to verify teacher assignments: %w", err)
		}
		if assignmentCount == 0 {
			return nil, ErrUnauthorizedTeacher
		}
	}

	// 8. Atomic Database Transaction: Insert/Update attendance + Insert immutable audit record
	var response *models.ManualAttendanceResponse

	txErr := db.Transaction(func(tx *gorm.DB) error {
		// Row-level lock check for existing attendance row
		var existing models.Attendance
		findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("session_id = ? AND student_id = ?", session.ID, student.ID).
			First(&existing).Error

		nowUTC := time.Now().UTC()

		if findErr == nil {
			// Record exists: Treat as correction / status change
			if existing.Status == cleanStatus {
				return fmt.Errorf("Attendance for this student is already marked as %s.", cleanStatus)
			}

			oldStatus := existing.Status
			existing.Status = cleanStatus
			existing.MarkedAt = nowUTC

			if err := tx.Save(&existing).Error; err != nil {
				return fmt.Errorf("failed to update attendance record: %w", err)
			}

			// Insert audit record
			audit := models.AttendanceAudit{
				AttendanceID:   &existing.ID,
				SessionID:      session.ID,
				StudentID:      student.ID,
				ActorUserID:    actorUserID,
				ActorRole:      cleanRole,
				Action:         models.AuditActionCorrection,
				PreviousStatus: &oldStatus,
				NewStatus:      cleanStatus,
				Reason:         cleanReason,
				CreatedAt:      nowUTC,
			}
			if err := tx.Create(&audit).Error; err != nil {
				return fmt.Errorf("failed to create attendance audit log: %w", err)
			}

			response = &models.ManualAttendanceResponse{
				AttendanceID: existing.ID,
				SessionID:    session.ID,
				StudentID:    student.ID,
				Status:       existing.Status,
				MarkedAt:     existing.MarkedAt,
				Action:       models.AuditActionCorrection,
				Reason:       cleanReason,
			}
			return nil
		}

		if !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}

		// Record does not exist: Insert new manual attendance
		newAttendance := models.Attendance{
			SessionID: session.ID,
			StudentID: student.ID,
			MarkedAt:  nowUTC,
			Status:    cleanStatus,
		}
		if err := tx.Create(&newAttendance).Error; err != nil {
			errStr := strings.ToLower(err.Error())
			if strings.Contains(errStr, "duplicate key") ||
				strings.Contains(errStr, "unique constraint") ||
				strings.Contains(errStr, "uq_session_student") {
				return errors.New("Attendance was modified by another user. Please refresh and try again.")
			}
			return fmt.Errorf("failed to record attendance: %w", err)
		}

		// Insert immutable audit trail
		audit := models.AttendanceAudit{
			AttendanceID:   &newAttendance.ID,
			SessionID:      session.ID,
			StudentID:      student.ID,
			ActorUserID:    actorUserID,
			ActorRole:      cleanRole,
			Action:         models.AuditActionManualMark,
			PreviousStatus: nil,
			NewStatus:      cleanStatus,
			Reason:         cleanReason,
			CreatedAt:      nowUTC,
		}
		if err := tx.Create(&audit).Error; err != nil {
			return fmt.Errorf("failed to create attendance audit log: %w", err)
		}

		response = &models.ManualAttendanceResponse{
			AttendanceID: newAttendance.ID,
			SessionID:    session.ID,
			StudentID:    student.ID,
			Status:       newAttendance.Status,
			MarkedAt:     newAttendance.MarkedAt,
			Action:       models.AuditActionManualMark,
			Reason:       cleanReason,
		}
		return nil
	})

	if txErr != nil {
		return nil, txErr
	}

	return response, nil
}

// CorrectAttendance modifies an existing attendance record status with mandatory reason and immutable audit trail
func CorrectAttendance(
	db *gorm.DB,
	actorUserID string,
	actorRole string,
	attendanceID string,
	req *models.CorrectAttendanceRequest,
) (*models.ManualAttendanceResponse, error) {
	// 1. Validate reason
	cleanReason, err := ValidateAttendanceReason(req.Reason)
	if err != nil {
		return nil, err
	}

	// 2. Validate requested status
	cleanStatus, err := ValidateAttendanceStatus(req.Status)
	if err != nil {
		return nil, err
	}

	// 3. Validate actor role
	cleanRole := strings.ToUpper(strings.TrimSpace(actorRole))
	if cleanRole != models.RoleTeacher && cleanRole != models.RoleAdmin {
		return nil, errors.New("Only teachers and administrators can correct attendance.")
	}

	cleanAttID := strings.TrimSpace(attendanceID)
	if cleanAttID == "" {
		return nil, errors.New("Attendance ID is required.")
	}

	var response *models.ManualAttendanceResponse

	txErr := db.Transaction(func(tx *gorm.DB) error {
		// 4. Lock attendance record with FOR UPDATE
		var attendance models.Attendance
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Preload("Session").
			Where("id = ?", cleanAttID).
			First(&attendance).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrAttendanceNotFound
			}
			return fmt.Errorf("failed to lock attendance record: %w", err)
		}

		// 5. Reject same status correction
		if attendance.Status == cleanStatus {
			return ErrSameStatusCorrection
		}

		// 6. Verify teacher assignment if actor is TEACHER
		if cleanRole == models.RoleTeacher {
			var teacher models.Teacher
			if err := tx.Preload("User").Where("user_id = ?", actorUserID).First(&teacher).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New("Teacher profile not found.")
				}
				return err
			}
			if !teacher.User.IsActive {
				return errors.New("Teacher account is inactive.")
			}

			var assignmentCount int64
			if err := tx.Model(&models.TeacherSubjectClass{}).
				Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacher.ID, attendance.Session.SubjectID, attendance.Session.ClassID).
				Count(&assignmentCount).Error; err != nil {
				return fmt.Errorf("failed to verify teacher authorization: %w", err)
			}
			if assignmentCount == 0 {
				return ErrUnauthorizedTeacher
			}
		}

		// 7. Update attendance status atomically
		nowUTC := time.Now().UTC()
		oldStatus := attendance.Status
		attendance.Status = cleanStatus
		attendance.MarkedAt = nowUTC

		if err := tx.Save(&attendance).Error; err != nil {
			return fmt.Errorf("failed to update attendance record: %w", err)
		}

		// 8. Insert immutable audit trail entry
		audit := models.AttendanceAudit{
			AttendanceID:   &attendance.ID,
			SessionID:      attendance.SessionID,
			StudentID:      attendance.StudentID,
			ActorUserID:    actorUserID,
			ActorRole:      cleanRole,
			Action:         models.AuditActionCorrection,
			PreviousStatus: &oldStatus,
			NewStatus:      cleanStatus,
			Reason:         cleanReason,
			CreatedAt:      nowUTC,
		}
		if err := tx.Create(&audit).Error; err != nil {
			return fmt.Errorf("failed to create attendance audit log: %w", err)
		}

		response = &models.ManualAttendanceResponse{
			AttendanceID: attendance.ID,
			SessionID:    attendance.SessionID,
			StudentID:    attendance.StudentID,
			Status:       attendance.Status,
			MarkedAt:     attendance.MarkedAt,
			Action:       models.AuditActionCorrection,
			Reason:       cleanReason,
		}
		return nil
	})

	if txErr != nil {
		return nil, txErr
	}

	return response, nil
}

// GetAttendanceAuditHistory retrieves the complete audit history timeline for an attendance record
func GetAttendanceAuditHistory(
	db *gorm.DB,
	actorUserID string,
	actorRole string,
	attendanceID string,
) ([]models.AttendanceAuditItem, error) {
	cleanRole := strings.ToUpper(strings.TrimSpace(actorRole))
	if cleanRole != models.RoleTeacher && cleanRole != models.RoleAdmin {
		return nil, errors.New("Access denied to attendance audit history.")
	}

	cleanAttID := strings.TrimSpace(attendanceID)
	if cleanAttID == "" {
		return nil, errors.New("Attendance ID is required.")
	}

	// 1. Fetch attendance record and associated session
	var attendance models.Attendance
	if err := db.Preload("Session").Where("id = ?", cleanAttID).First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, err
	}

	// 2. Verify authorization for teacher
	if cleanRole == models.RoleTeacher {
		var teacher models.Teacher
		if err := db.Where("user_id = ?", actorUserID).First(&teacher).Error; err != nil {
			return nil, errors.New("Teacher profile not found.")
		}

		var count int64
		if err := db.Model(&models.TeacherSubjectClass{}).
			Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacher.ID, attendance.Session.SubjectID, attendance.Session.ClassID).
			Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to verify teacher authorization: %w", err)
		}
		if count == 0 {
			return nil, ErrUnauthorizedTeacher
		}
	}

	// 3. Query audit items joined with user name
	type auditRow struct {
		ID             string
		CollegeID      *string
		AttendanceID   *string
		SessionID      string
		StudentID      string
		ActorUserID    string
		ActorName      string
		ActorRole      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         string
		CreatedAt      time.Time
	}

	var rows []auditRow
	query := `
		SELECT 
			a.id,
			a.college_id,
			a.attendance_id,
			a.session_id,
			a.student_id,
			a.actor_user_id,
			u.name AS actor_name,
			a.actor_role,
			a.action,
			a.previous_status,
			a.new_status,
			a.reason,
			a.created_at
		FROM attendance_audit a
		JOIN users u ON a.actor_user_id = u.id
		WHERE a.attendance_id = ? OR (a.session_id = ? AND a.student_id = ?)
		ORDER BY a.created_at ASC
	`
	if err := db.Raw(query, attendance.ID, attendance.SessionID, attendance.StudentID).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch audit history: %w", err)
	}

	results := make([]models.AttendanceAuditItem, len(rows))
	for i, r := range rows {
		results[i] = models.AttendanceAuditItem{
			ID:             r.ID,
			CollegeID:      r.CollegeID,
			AttendanceID:   r.AttendanceID,
			SessionID:      r.SessionID,
			StudentID:      r.StudentID,
			ActorUserID:    r.ActorUserID,
			ActorName:      r.ActorName,
			ActorRole:      r.ActorRole,
			Action:         r.Action,
			PreviousStatus: r.PreviousStatus,
			NewStatus:      r.NewStatus,
			Reason:         r.Reason,
			CreatedAt:      r.CreatedAt,
		}
	}

	return results, nil
}


