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
)

// CreateSessionInput defines the payload required by a teacher to launch a live attendance session
type CreateSessionInput struct {
	SubjectID       string `json:"subject_id" binding:"required"`
	ClassID         string `json:"class_id" binding:"required"`
	DurationMinutes int    `json:"duration_minutes" binding:"required,min=1,max=60"`
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
		TeacherID:    teacher.ID,
		SubjectID:    subject.ID,
		ClassID:      class.ID,
		SessionToken: token,
		StartedAt:    now,
		ExpiresAt:    expiresAt,
		IsActive:     true,
	}

	if err := db.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to save attendance session: %w", err)
	}

	// Total students in class
	var totalStudents int64
	db.Model(&models.Student{}).Where("class_id = ?", class.ID).Count(&totalStudents)

	durationMins := computeDurationMinutes(session.StartedAt, session.ExpiresAt)

	return &models.AttendanceSessionResponse{
		ID:                session.ID,
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
		SessionToken:      session.SessionToken,
		StartedAt:         session.StartedAt,
		ExpiresAt:         session.ExpiresAt,
		DurationMinutes:   durationMins,
		IsActive:          session.IsActive,
		IsExpired:         false,
		PresentCount:      0,
		AbsentCount:       totalStudents,
		TotalStudents:     totalStudents,
		Percentage:        0.0,
		Status:            "ACTIVE",
		CreatedAt:         session.CreatedAt,
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
		db.Model(&models.Attendance{}).Where("session_id = ?", s.ID).Count(&presentCount)

		var totalStudents int64
		db.Model(&models.Student{}).Where("class_id = ?", s.ClassID).Count(&totalStudents)

		pct := 0.0
		if totalStudents > 0 {
			pct = math.Round((float64(presentCount)/float64(totalStudents))*1000) / 10
		}

		isExpired := now.After(s.ExpiresAt)
		duration := computeDurationMinutes(s.StartedAt, s.ExpiresAt)
		absentCount := computeAbsentCount(totalStudents, presentCount)
		sessionStatus := computeSessionStatus(s.IsActive, isExpired)

		results[i] = models.AttendanceSessionResponse{
			ID:                s.ID,
			TeacherID:         teacher.ID,
			SubjectID:         s.SubjectID,
			SubjectName:       s.Subject.Name,
			SubjectCode:       s.Subject.Code,
			ClassID:           s.ClassID,
			ClassName:         s.Class.Name,
			Department:        s.Class.Department,
			Semester:          s.Class.Semester,
			Section:           s.Class.Section,
			AcademicYear:      s.Class.AcademicYear,
			SessionToken:      s.SessionToken,
			StartedAt:         s.StartedAt,
			ExpiresAt:         s.ExpiresAt,
			DurationMinutes:   duration,
			IsActive:          s.IsActive,
			IsExpired:         isExpired,
			PresentCount:      presentCount,
			AbsentCount:       absentCount,
			TotalStudents:     totalStudents,
			Percentage:        pct,
			Status:            sessionStatus,
			CreatedAt:         s.CreatedAt,
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
	db.Model(&models.Attendance{}).Where("session_id = ?", session.ID).Count(&presentCount)

	var totalStudents int64
	db.Model(&models.Student{}).Where("class_id = ?", session.ClassID).Count(&totalStudents)

	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(presentCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	absentCount := computeAbsentCount(totalStudents, presentCount)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	return &models.AttendanceSessionResponse{
		ID:                session.ID,
		TeacherID:         teacher.ID,
		TeacherName:       teacher.User.Name,
		TeacherEmployeeID: teacher.EmployeeID,
		SubjectID:         session.SubjectID,
		SubjectName:       session.Subject.Name,
		SubjectCode:       session.Subject.Code,
		ClassID:           session.ClassID,
		ClassName:         session.Class.Name,
		Department:        session.Class.Department,
		Semester:          session.Class.Semester,
		Section:           session.Class.Section,
		AcademicYear:      session.Class.AcademicYear,
		SessionToken:      session.SessionToken,
		StartedAt:         session.StartedAt,
		ExpiresAt:         session.ExpiresAt,
		DurationMinutes:   duration,
		IsActive:          session.IsActive,
		IsExpired:         isExpired,
		PresentCount:      presentCount,
		AbsentCount:       absentCount,
		TotalStudents:     totalStudents,
		Percentage:        pct,
		Status:            sessionStatus,
		CreatedAt:         session.CreatedAt,
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

	// Fetch all PRESENT attendances for this session joined with student and user details, ordered newest marked_at first
	type presentRow struct {
		StudentID  string
		RollNumber string
		Name       string
		Email      string
		MarkedAt   time.Time
	}
	var presentRows []presentRow
	query := `
		SELECT a.student_id, s.roll_number, u.name, u.email, a.marked_at
		FROM attendance a
		JOIN students s ON a.student_id = s.id
		JOIN users u ON s.user_id = u.id
		WHERE a.session_id = ?
		ORDER BY a.marked_at DESC
	`
	if err := db.Raw(query, session.ID).Scan(&presentRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch live attendance check-ins: %w", err)
	}

	presentCount := int64(len(presentRows))
	absentCount := computeAbsentCount(totalStudents, presentCount)
	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(presentCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	students := make([]models.AttendanceStudentRecord, len(presentRows))
	for i, r := range presentRows {
		mTime := r.MarkedAt
		students[i] = models.AttendanceStudentRecord{
			StudentID:  r.StudentID,
			RollNumber: r.RollNumber,
			Name:       r.Name,
			Email:      r.Email,
			Status:     "PRESENT",
			MarkedAt:   &mTime,
		}
	}

	return &models.LiveAttendanceSessionResponse{
		SessionID:            session.ID,
		Status:               sessionStatus,
		TotalStudents:        totalStudents,
		PresentCount:         presentCount,
		AbsentCount:          absentCount,
		AttendancePercentage: pct,
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

// GetSessionAttendanceRecords returns the full class roster with PRESENT (marked time) and dynamically calculated ABSENT
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

	// 2. Fetch present records for this session
	var attendances []models.Attendance
	if err := db.Where("session_id = ?", session.ID).Find(&attendances).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance entries: %w", err)
	}

	presentMap := make(map[string]time.Time)
	for _, a := range attendances {
		presentMap[a.StudentID] = a.MarkedAt
	}

	// 3. Build full roster records
	records := make([]models.AttendanceStudentRecord, len(classStudents))
	var presentCount int64 = 0

	for i, st := range classStudents {
		markedTime, isPresent := presentMap[st.ID]
		if isPresent {
			presentCount++
			tCopy := markedTime
			records[i] = models.AttendanceStudentRecord{
				StudentID:  st.ID,
				RollNumber: st.RollNumber,
				Name:       st.Name,
				Email:      st.Email,
				Status:     "PRESENT",
				MarkedAt:   &tCopy,
			}
		} else {
			records[i] = models.AttendanceStudentRecord{
				StudentID:  st.ID,
				RollNumber: st.RollNumber,
				Name:       st.Name,
				Email:      st.Email,
				Status:     "ABSENT",
				MarkedAt:   nil,
			}
		}
	}

	totalStudents := int64(len(classStudents))
	pct := 0.0
	if totalStudents > 0 {
		pct = math.Round((float64(presentCount)/float64(totalStudents))*1000) / 10
	}

	now := time.Now().UTC()
	isExpired := now.After(session.ExpiresAt)
	duration := computeDurationMinutes(session.StartedAt, session.ExpiresAt)
	absentCount := computeAbsentCount(totalStudents, presentCount)
	sessionStatus := computeSessionStatus(session.IsActive, isExpired)

	return &models.SessionAttendanceDetailsResponse{
		Session: models.AttendanceSessionResponse{
			ID:                session.ID,
			TeacherID:         session.TeacherID,
			TeacherName:       session.Teacher.User.Name,
			TeacherEmployeeID: session.Teacher.EmployeeID,
			SubjectID:         session.SubjectID,
			SubjectName:       session.Subject.Name,
			SubjectCode:       session.Subject.Code,
			ClassID:           session.ClassID,
			ClassName:         session.Class.Name,
			Department:        session.Class.Department,
			Semester:          session.Class.Semester,
			Section:           session.Class.Section,
			AcademicYear:      session.Class.AcademicYear,
			SessionToken:      session.SessionToken,
			StartedAt:         session.StartedAt,
			ExpiresAt:         session.ExpiresAt,
			DurationMinutes:   duration,
			IsActive:          session.IsActive,
			IsExpired:         isExpired,
			PresentCount:      presentCount,
			AbsentCount:       absentCount,
			TotalStudents:     totalStudents,
			Percentage:        pct,
			Status:            sessionStatus,
			CreatedAt:         session.CreatedAt,
		},
		Records:       records,
		PresentCount:  presentCount,
		TotalStudents: totalStudents,
		Percentage:    pct,
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

		// 7. Insert attendance record atomically
		attendance := models.Attendance{
			SessionID: session.ID,
			StudentID: student.ID,
			MarkedAt:  serverNow,
			Status:    "PRESENT",
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
			SessionID:   session.ID,
			MarkedAt:    attendance.MarkedAt,
			SubjectName: session.Subject.Name,
			SubjectCode: session.Subject.Code,
			ClassName:   session.Class.Name,
			Status:      attendance.Status,
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
			TotalAbsent:       0,
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
			Where("a.student_id = ? AND s.subject_id = ?", student.ID, sub.ID).
			Count(&presentSubSessions)

		subPct := 0.0
		if totalSubSessions > 0 {
			subPct = math.Round((float64(presentSubSessions)/float64(totalSubSessions))*1000) / 10
		}

		absentSubSessions := int64(0)
		if totalSubSessions > presentSubSessions {
			absentSubSessions = totalSubSessions - presentSubSessions
		}

		totalAllSessions += totalSubSessions
		totalAllPresent += presentSubSessions

		subjectsSummary[i] = models.SubjectAttendanceStat{
			SubjectID:       sub.ID,
			SubjectName:     sub.Name,
			SubjectCode:     sub.Code,
			PresentSessions: presentSubSessions,
			AbsentSessions:  absentSubSessions,
			TotalSessions:   totalSubSessions,
			Percentage:      subPct,
		}
	}

	overallPct := 0.0
	if totalAllSessions > 0 {
		overallPct = math.Round((float64(totalAllPresent)/float64(totalAllSessions))*1000) / 10
	}

	totalAllAbsent := int64(0)
	if totalAllSessions > totalAllPresent {
		totalAllAbsent = totalAllSessions - totalAllPresent
	}

	return &models.StudentAttendanceSummary{
		OverallPercentage: overallPct,
		TotalSessions:     totalAllSessions,
		TotalPresent:      totalAllPresent,
		TotalAbsent:       totalAllAbsent,
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
				SessionsHeld: 0,
				Present:      0,
				Absent:       0,
				Percentage:   0.0,
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
				SessionsHeld: 0,
				Present:      0,
				Absent:       0,
				Percentage:   0.0,
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
	var totalAbsent int64 = 0

	for _, s := range sessions {
		dateKey := s.StartedAt.Format("2006-01-02")
		totalHeld++

		att, found := attMap[s.ID]
		var sessionItem models.StudentCalendarSessionItem
		if found && att.Status == "PRESENT" {
			totalPresent++
			markedAt := att.MarkedAt
			sessionItem = models.StudentCalendarSessionItem{
				SessionID:   s.ID,
				SubjectID:   s.SubjectID,
				SubjectName: s.Subject.Name,
				SubjectCode: s.Subject.Code,
				Status:      "PRESENT",
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
				Status:      "ABSENT",
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
		absentCount := 0
		for _, it := range sessionItems {
			if it.Status == "PRESENT" {
				presentCount++
			} else {
				absentCount++
			}
		}

		dayStatus := "PRESENT"
		if presentCount > 0 && absentCount > 0 {
			dayStatus = "PARTIAL"
		} else if absentCount > 0 && presentCount == 0 {
			dayStatus = "ABSENT"
		}

		days[i] = models.StudentCalendarDay{
			Date:     d,
			Status:   dayStatus,
			Sessions: sessionItems,
		}
	}

	pct := 0.0
	if totalHeld > 0 {
		pct = math.Round((float64(totalPresent)/float64(totalHeld))*1000) / 10
	}

	return &models.StudentCalendarResponse{
		Month: cleanMonth,
		Summary: models.StudentCalendarSummary{
			SessionsHeld: totalHeld,
			Present:      totalPresent,
			Absent:       totalAbsent,
			Percentage:   pct,
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
				Total:      0,
				Present:    0,
				Absent:     0,
				Percentage: 0.0,
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
	} else if cleanStatus == "ABSENT" {
		baseQuery += " AND (a.id IS NULL OR a.status != 'PRESENT')"
	}

	// 2. Count total matching records and present count for summary
	type summaryCounts struct {
		TotalCount   int64 `gorm:"column:total_count"`
		PresentCount int64 `gorm:"column:present_count"`
	}
	var counts summaryCounts
	summarySQL := `
		SELECT 
			COUNT(*) AS total_count,
			COUNT(CASE WHEN a.id IS NOT NULL AND a.status = 'PRESENT' THEN 1 END) AS present_count
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
	totalAbsent := int64(0)
	if totalRecords > totalPresent {
		totalAbsent = totalRecords - totalPresent
	}

	pct := 0.0
	if totalRecords > 0 {
		pct = math.Round((float64(totalPresent)/float64(totalRecords))*1000) / 10
	}

	summary := models.StudentAttendanceHistorySummary{
		Total:      totalRecords,
		Present:    totalPresent,
		Absent:     totalAbsent,
		Percentage: pct,
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
		db.Model(&models.Attendance{}).Where("session_id = ?", s.ID).Count(&presentCount)

		var totalStudents int64
		db.Model(&models.Student{}).Where("class_id = ?", s.ClassID).Count(&totalStudents)

		pct := 0.0
		if totalStudents > 0 {
			pct = math.Round((float64(presentCount)/float64(totalStudents))*1000) / 10
		}

		isExpired := now.After(s.ExpiresAt)
		duration := computeDurationMinutes(s.StartedAt, s.ExpiresAt)
		absentCount := computeAbsentCount(totalStudents, presentCount)
		sessionStatus := computeSessionStatus(s.IsActive, isExpired)

		results[i] = models.AttendanceSessionResponse{
			ID:                s.ID,
			TeacherID:         s.TeacherID,
			TeacherName:       s.Teacher.User.Name,
			TeacherEmployeeID: s.Teacher.EmployeeID,
			SubjectID:         s.SubjectID,
			SubjectName:       s.Subject.Name,
			SubjectCode:       s.Subject.Code,
			ClassID:           s.ClassID,
			ClassName:         s.Class.Name,
			Department:        s.Class.Department,
			Semester:          s.Class.Semester,
			Section:           s.Class.Section,
			AcademicYear:      s.Class.AcademicYear,
			SessionToken:      s.SessionToken,
			StartedAt:         s.StartedAt,
			ExpiresAt:         s.ExpiresAt,
			DurationMinutes:   duration,
			IsActive:          s.IsActive,
			IsExpired:         isExpired,
			PresentCount:      presentCount,
			AbsentCount:       absentCount,
			TotalStudents:     totalStudents,
			Percentage:        pct,
			Status:            sessionStatus,
			CreatedAt:         s.CreatedAt,
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
				TotalAbsent:              0,
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

	attendedSessionSet := make(map[string]bool)
	if len(sessionIDs) > 0 {
		var attendedIDs []string
		if err := db.Table("attendance").
			Where("student_id = ? AND session_id IN ?", student.ID, sessionIDs).
			Pluck("session_id", &attendedIDs).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch student attendance records: %w", err)
		}
		for _, id := range attendedIDs {
			attendedSessionSet[id] = true
		}
	}

	// 5. In-Memory Aggregations
	var totalSessions int64 = int64(len(sessions))
	var totalPresent int64 = 0

	// Subject stats map: subjectID -> (total, present)
	type subStat struct {
		Total   int64
		Present int64
	}
	subjectStatsMap := make(map[string]*subStat)
	for _, s := range classSubjects {
		subjectStatsMap[s.ID] = &subStat{Total: 0, Present: 0}
	}

	// Monthly stats map: "YYYY-MM" -> (total, present)
	monthlyStatsMap := make(map[string]*subStat)

	for _, s := range sessions {
		monthKey := s.StartedAt.UTC().Format("2006-01")
		if _, ok := monthlyStatsMap[monthKey]; !ok {
			monthlyStatsMap[monthKey] = &subStat{Total: 0, Present: 0}
		}
		monthlyStatsMap[monthKey].Total++

		if stat, ok := subjectStatsMap[s.SubjectID]; ok {
			stat.Total++
		}

		if attendedSessionSet[s.ID] {
			totalPresent++
			monthlyStatsMap[monthKey].Present++
			if stat, ok := subjectStatsMap[s.SubjectID]; ok {
				stat.Present++
			}
		}
	}

	var totalAbsent int64 = 0
	if totalSessions > totalPresent {
		totalAbsent = totalSessions - totalPresent
	}

	overallPct := 0.0
	if totalSessions > 0 {
		overallPct = math.Round((float64(totalPresent)/float64(totalSessions))*1000) / 10
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
		if st != nil {
			subTotal = st.Total
			subPresent = st.Present
		}
		subAbsent := int64(0)
		if subTotal > subPresent {
			subAbsent = subTotal - subPresent
		}

		subPct := 0.0
		if subTotal > 0 {
			subPct = math.Round((float64(subPresent)/float64(subTotal))*1000) / 10
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
			AbsentSessions:  subAbsent,
			Percentage:      subPct,
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
		mAbsent := int64(0)
		if st.Total > st.Present {
			mAbsent = st.Total - st.Present
		}
		mPct := 0.0
		if st.Total > 0 {
			mPct = math.Round((float64(st.Present)/float64(st.Total))*1000) / 10
		}
		monthlyStats[i] = models.StudentAttendanceMonthlyStat{
			Month:      m,
			Sessions:   st.Total,
			Present:    st.Present,
			Absent:     mAbsent,
			Percentage: mPct,
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
			val := int(3*totalSessions - 4*totalPresent)
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
			TotalAbsent:              totalAbsent,
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
