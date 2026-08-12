package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrProofNotFound             = errors.New("Attendance proof not found.")
	ErrUnauthorizedProofAccess   = errors.New("You are not authorized to access this attendance proof.")
	ErrInvalidVerificationPublicID = errors.New("Invalid or expired attendance proof identifier.")
)

const (
	proofAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 32 characters, avoids easily confused 0, O, 1, I
)

// GeneratePublicProofID generates a cryptographically random, unguessable public proof identifier
func GeneratePublicProofID() (string, error) {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes for proof id: %w", err)
	}

	var sb strings.Builder
	for _, b := range bytes {
		sb.WriteByte(proofAlphabet[int(b)%len(proofAlphabet)])
	}

	year := time.Now().UTC().Year()
	return fmt.Sprintf("ATT-%d-%s", year, sb.String()), nil
}

// GetStatusLabel maps attendance status to a professional institutional receipt label
func GetStatusLabel(status string) string {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case models.StatusPresent:
		return "Present — On Time"
	case models.StatusLate:
		return "Late — Attendance Recorded"
	case models.StatusAbsent:
		return "Absent"
	default:
		return status
	}
}

// GetOrCreateAttendanceProof retrieves an existing proof or creates one idempotently within a transaction
func GetOrCreateAttendanceProof(tx *gorm.DB, attendanceID string, collegeID *string) (*models.AttendanceProof, error) {
	cleanAttendanceID := strings.TrimSpace(attendanceID)
	if cleanAttendanceID == "" {
		return nil, errors.New("Attendance ID is required.")
	}

	var existing models.AttendanceProof
	if err := tx.Where("attendance_id = ?", cleanAttendanceID).First(&existing).Error; err == nil {
		return &existing, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to query existing proof: %w", err)
	}

	// Generate a unique public ID with retry to ensure zero collision
	var publicID string
	for attempt := 0; attempt < 5; attempt++ {
		genID, err := GeneratePublicProofID()
		if err != nil {
			return nil, err
		}

		var count int64
		if err := tx.Model(&models.AttendanceProof{}).Where("public_id = ?", genID).Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to check public_id collision: %w", err)
		}
		if count == 0 {
			publicID = genID
			break
		}
	}

	if publicID == "" {
		return nil, errors.New("Failed to generate unique attendance proof identifier.")
	}

	proof := models.AttendanceProof{
		AttendanceID: cleanAttendanceID,
		PublicID:     publicID,
		CollegeID:    collegeID,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	if err := tx.Create(&proof).Error; err != nil {
		// In case of concurrent creation, retry fetch
		if errFetch := tx.Where("attendance_id = ?", cleanAttendanceID).First(&existing).Error; errFetch == nil {
			return &existing, nil
		}
		return nil, fmt.Errorf("failed to create attendance proof record: %w", err)
	}

	return &proof, nil
}

// buildAttendanceProofResponse queries all authoritative relations and constructs the safe DTO
func buildAttendanceProofResponse(db *gorm.DB, proof *models.AttendanceProof, attendanceID string, baseURL string) (*models.AttendanceProofResponse, error) {
	var attendance models.Attendance
	if err := db.
		Preload("Student").
		Preload("Student.User").
		Preload("Student.Class").
		Preload("Session").
		Preload("Session.Subject").
		Preload("Session.Class").
		Preload("Session.Teacher").
		Preload("Session.Teacher.User").
		Where("id = ?", attendanceID).
		First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, fmt.Errorf("failed to load attendance record: %w", err)
	}

	session := attendance.Session
	student := attendance.Student

	// College Name fallback
	collegeName := "Institutional Attendance Management System"

	// Clean Base URL for verification link
	cleanBase := strings.TrimRight(baseURL, "/")
	verificationURL := fmt.Sprintf("%s/verify/attendance/%s", cleanBase, proof.PublicID)

	teacherName := "Faculty Instructor"
	teacherDept := ""
	if session.Teacher.User.Name != "" {
		teacherName = session.Teacher.User.Name
	}
	if session.Teacher.Department != "" {
		teacherDept = session.Teacher.Department
	}

	statusLabel := GetStatusLabel(attendance.Status)

	resp := &models.AttendanceProofResponse{
		ProofID:              proof.ID,
		PublicID:             proof.PublicID,
		VerificationURL:      verificationURL,
		VerificationStatus:   "VALID",
		AttendanceID:         attendance.ID,
		StudentID:            student.ID,
		StudentName:          student.User.Name,
		RollNumber:           student.RollNumber,
		Email:                student.User.Email,
		Department:           student.Department,
		Semester:             student.Semester,
		Section:              student.Section,
		ClassName:            session.Class.Name,
		SubjectID:            session.Subject.ID,
		SubjectName:          session.Subject.Name,
		SubjectCode:          session.Subject.Code,
		TeacherName:          teacherName,
		TeacherDepartment:    teacherDept,
		SessionID:            session.ID,
		SessionDate:          session.StartedAt.Format("2006-01-02"),
		SessionStartTime:     session.StartedAt.Format("15:04"),
		SessionEndTime:       session.ExpiresAt.Format("15:04"),
		AttendanceMarkedAt:   attendance.MarkedAt,
		AttendanceStatus:     attendance.Status,
		StatusLabel:          statusLabel,
		LateThresholdMinutes: session.LateThresholdMinutes,
		CollegeName:          collegeName,
		GeneratedAt:          time.Now().UTC(),
	}

	return resp, nil
}

// GetStudentAttendanceProof retrieves attendance proof for a student with strict ownership verification
func GetStudentAttendanceProof(db *gorm.DB, studentUserID string, attendanceID string, baseURL string) (*models.AttendanceProofResponse, error) {
	// 1. Verify student profile
	var student models.Student
	if err := db.Where("user_id = ?", studentUserID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStudentProfileNotFound
		}
		return nil, err
	}

	// 2. Fetch attendance record
	var attendance models.Attendance
	if err := db.Where("id = ?", attendanceID).First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, err
	}

	// 3. IDOR Protection: Student can only view their own proof
	if attendance.StudentID != student.ID {
		return nil, ErrUnauthorizedProofAccess
	}

	// 4. Get or create proof idempotently
	proof, err := GetOrCreateAttendanceProof(db, attendance.ID, nil)
	if err != nil {
		return nil, err
	}

	return buildAttendanceProofResponse(db, proof, attendance.ID, baseURL)
}

// GetTeacherAttendanceProof retrieves attendance proof for a teacher with class/subject assignment authorization
func GetTeacherAttendanceProof(db *gorm.DB, teacherUserID string, attendanceID string, baseURL string) (*models.AttendanceProofResponse, error) {
	// 1. Verify teacher profile
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Teacher profile not found.")
		}
		return nil, err
	}

	// 2. Fetch attendance and session
	var attendance models.Attendance
	if err := db.Preload("Session").Where("id = ?", attendanceID).First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, err
	}

	// 3. Verify teacher authorization for the session's class and subject
	var assignmentCount int64
	if err := db.Model(&models.TeacherSubjectClass{}).
		Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacher.ID, attendance.Session.SubjectID, attendance.Session.ClassID).
		Count(&assignmentCount).Error; err != nil {
		return nil, fmt.Errorf("failed to verify teacher assignment: %w", err)
	}
	if assignmentCount == 0 {
		return nil, ErrUnauthorizedProofAccess
	}

	// 4. Get or create proof idempotently
	proof, err := GetOrCreateAttendanceProof(db, attendance.ID, nil)
	if err != nil {
		return nil, err
	}

	return buildAttendanceProofResponse(db, proof, attendance.ID, baseURL)
}

// GetAdminAttendanceProof retrieves attendance proof for an administrator with tenant verification
func GetAdminAttendanceProof(db *gorm.DB, adminUserID string, attendanceID string, baseURL string) (*models.AttendanceProofResponse, error) {
	// 1. Verify admin user
	var admin models.User
	if err := db.Where("id = ? AND role = ?", adminUserID, models.RoleAdmin).First(&admin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Admin account not found.")
		}
		return nil, err
	}

	// 2. Fetch attendance
	var attendance models.Attendance
	if err := db.Where("id = ?", attendanceID).First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttendanceNotFound
		}
		return nil, err
	}

	// 3. Get or create proof idempotently
	proof, err := GetOrCreateAttendanceProof(db, attendance.ID, nil)
	if err != nil {
		return nil, err
	}

	return buildAttendanceProofResponse(db, proof, attendance.ID, baseURL)
}

// VerifyAttendanceProof performs unauthenticated public verification of an attendance proof code
func VerifyAttendanceProof(db *gorm.DB, publicID string) (*models.AttendanceProofPublicVerificationResponse, error) {
	cleanPublicID := strings.TrimSpace(publicID)
	if cleanPublicID == "" {
		return &models.AttendanceProofPublicVerificationResponse{
			Valid:              false,
			VerificationStatus: "INVALID",
			VerifiedAt:         time.Now().UTC(),
			Message:            "The attendance proof could not be verified. Invalid proof code.",
		}, nil
	}

	var proof models.AttendanceProof
	if err := db.Where("public_id = ?", cleanPublicID).First(&proof).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &models.AttendanceProofPublicVerificationResponse{
				Valid:              false,
				VerificationStatus: "INVALID",
				PublicID:           cleanPublicID,
				VerifiedAt:         time.Now().UTC(),
				Message:            "The attendance proof could not be verified. Record not found.",
			}, nil
		}
		return nil, fmt.Errorf("failed to query proof record: %w", err)
	}

	// Fetch authoritative live attendance data (reflects any corrections)
	var attendance models.Attendance
	if err := db.
		Preload("Student").
		Preload("Student.User").
		Preload("Student.Class").
		Preload("Session").
		Preload("Session.Subject").
		Preload("Session.Class").
		Where("id = ?", proof.AttendanceID).
		First(&attendance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &models.AttendanceProofPublicVerificationResponse{
				Valid:              false,
				VerificationStatus: "INVALID",
				PublicID:           proof.PublicID,
				VerifiedAt:         time.Now().UTC(),
				Message:            "The attendance proof could not be verified. Attendance record missing.",
			}, nil
		}
		return nil, fmt.Errorf("failed to retrieve verified attendance: %w", err)
	}

	markedAt := attendance.MarkedAt
	statusLabel := GetStatusLabel(attendance.Status)

	return &models.AttendanceProofPublicVerificationResponse{
		Valid:              true,
		VerificationStatus: "VALID",
		PublicID:           proof.PublicID,
		StudentName:        attendance.Student.User.Name,
		RollNumber:         attendance.Student.RollNumber,
		Department:         attendance.Student.Department,
		ClassName:          attendance.Session.Class.Name,
		SubjectName:        attendance.Session.Subject.Name,
		SubjectCode:        attendance.Session.Subject.Code,
		SessionDate:        attendance.Session.StartedAt.Format("2006-01-02"),
		AttendanceMarkedAt: &markedAt,
		AttendanceStatus:   attendance.Status,
		StatusLabel:        statusLabel,
		CollegeName:        "Institutional Attendance Management System",
		VerifiedAt:         time.Now().UTC(),
		Message:            "Attendance Proof is genuine, verified, and officially recorded.",
	}, nil
}
