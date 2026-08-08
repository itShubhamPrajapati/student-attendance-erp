package models

import (
	"time"
)

// Role defines user roles in the system
type Role string

const (
	RoleAdmin   Role = "admin"
	RoleTeacher Role = "teacher"
	RoleStudent Role = "student"
)

// User represents the base user entity for authentication (Phase 2 ready)
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Email        string    `gorm:"size:150;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"` // Never expose in JSON
	Role         Role      `gorm:"size:20;not null;default:'student'" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Student profile linked to User (Phase 2 ready)
type Student struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	RollNumber string    `gorm:"size:50;uniqueIndex;not null" json:"roll_number"`
	ClassID    uint      `gorm:"not null" json:"class_id"`
	Class      Class     `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Teacher profile linked to User (Phase 2 ready)
type Teacher struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Department string    `gorm:"size:100;not null" json:"department"`
	EmployeeID string    `gorm:"size:50;uniqueIndex;not null" json:"employee_id"`
	CreatedAt  time.Time `json:"created_at"`
}

// Subject represents an academic course (Phase 2 ready)
type Subject struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Code        string    `gorm:"size:20;uniqueIndex;not null" json:"code"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"size:255" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Class represents a classroom or batch (Phase 2 ready)
type Class struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:100;not null" json:"name"`
	Section    string    `gorm:"size:20" json:"section"`
	Department string    `gorm:"size:100" json:"department"`
	CreatedAt  time.Time `json:"created_at"`
}

// AttendanceSession represents a live QR attendance session created by a Teacher (Phase 2 ready)
type AttendanceSession struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TeacherID   uint      `gorm:"not null" json:"teacher_id"`
	ClassID     uint      `gorm:"not null" json:"class_id"`
	SubjectID   uint      `gorm:"not null" json:"subject_id"`
	SessionCode string    `gorm:"size:100;uniqueIndex;not null" json:"session_code"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	CreatedAt   time.Time `json:"created_at"`
}

// Attendance records a student's check-in for a session (Phase 2 ready)
type Attendance struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SessionID uint      `gorm:"not null;index" json:"session_id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	Status    string    `gorm:"size:20;default:'PRESENT'" json:"status"`
	MarkedAt  time.Time `json:"marked_at"`
}
