package models

import (
	"time"
)

// Role constants
const (
	RoleAdmin   = "ADMIN"
	RoleTeacher = "TEACHER"
	RoleStudent = "STUDENT"
)

// User represents the base authentication entity
type User struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:text;not null" json:"-"` // Never expose in JSON responses
	Role         string    `gorm:"type:varchar(20);not null" json:"role"`
	IsActive     bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Student profile entity linked to User
type Student struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	RollNumber string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"roll_number"`
	Department string    `gorm:"type:varchar(100);not null" json:"department"`
	Semester   int       `gorm:"not null" json:"semester"`
	Section    string    `gorm:"type:varchar(20);not null" json:"section"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Teacher profile entity linked to User
type Teacher struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	EmployeeID string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"employee_id"`
	Department string    `gorm:"type:varchar(100);not null" json:"department"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// StudentResponse represents the student object for Admin API responses
type StudentResponse struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	RollNumber string    `json:"roll_number"`
	Department string    `json:"department"`
	Semester   int       `json:"semester"`
	Section    string    `json:"section"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

// TeacherResponse represents the teacher object for Admin API responses
type TeacherResponse struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	EmployeeID string    `json:"employee_id"`
	Department string    `json:"department"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
}

// UserSafeResponse represents user info returned upon login and /api/auth/me
type UserSafeResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
}

// DashboardStatsResponse represents aggregated counts for the Admin console
type DashboardStatsResponse struct {
	Success  bool `json:"success"`
	Students struct {
		Total  int64 `json:"total"`
		Active int64 `json:"active"`
	} `json:"students"`
	Teachers struct {
		Total  int64 `json:"total"`
		Active int64 `json:"active"`
	} `json:"teachers"`
}
