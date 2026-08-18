package services

import (
	"errors"
	"strings"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

// GetStudentProfile retrieves authoritative student profile information by authenticated user_id
func GetStudentProfile(db *gorm.DB, userID string) (*models.StudentProfileResponse, error) {
	if userID == "" {
		return nil, errors.New("unauthorized: missing user identifier")
	}

	var student models.Student
	if err := db.Preload("User").Preload("Class").Where("user_id = ?", userID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student profile not found")
		}
		return nil, err
	}

	resp := &models.StudentProfileResponse{
		ID:         student.ID,
		UserID:     student.UserID,
		Name:       student.User.Name,
		Email:      student.User.Email,
		RollNumber: student.RollNumber,
		Department: student.Department,
		Semester:   student.Semester,
		Section:    student.Section,
		Phone:      student.Phone,
		Address:    student.Address,
		IsActive:   student.User.IsActive,
		CreatedAt:  student.CreatedAt,
	}

	if student.Class != nil {
		resp.Class = &models.ClassBriefResponse{
			ID:           student.Class.ID,
			Name:         student.Class.Name,
			Department:   student.Class.Department,
			Semester:     student.Class.Semester,
			Section:      student.Class.Section,
			AcademicYear: student.Class.AcademicYear,
		}
	}

	return resp, nil
}

// UpdateStudentProfile updates permitted student personal contact details (phone, address)
func UpdateStudentProfile(db *gorm.DB, userID string, req models.StudentProfileUpdateRequest) (*models.StudentProfileResponse, error) {
	if userID == "" {
		return nil, errors.New("unauthorized: missing user identifier")
	}

	var student models.Student
	if err := db.Preload("User").Preload("Class").Where("user_id = ?", userID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student profile not found")
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
			student.Phone = nil
		} else {
			student.Phone = &trimmedPhone
		}
	}

	// Validate and sanitize Address if provided
	if req.Address != nil {
		trimmedAddress := strings.TrimSpace(*req.Address)
		if len(trimmedAddress) > 255 {
			return nil, errors.New("address cannot exceed 255 characters")
		}
		if trimmedAddress == "" {
			student.Address = nil
		} else {
			student.Address = &trimmedAddress
		}
	}

	if err := db.Save(&student).Error; err != nil {
		return nil, err
	}

	return GetStudentProfile(db, userID)
}

// ChangeStudentPassword validates current password and sets a secure bcrypt-hashed new password
func ChangeStudentPassword(db *gorm.DB, userID string, req models.ChangePasswordRequest) error {
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
