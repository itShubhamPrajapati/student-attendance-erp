package models

import (
	"time"
)

// User Roles Enum Constants
const (
	RoleAdmin   = "ADMIN"
	RoleTeacher = "TEACHER"
	RoleStudent = "STUDENT"
)

// User represents the system authentication account
type User struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(150);unique;not null" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	Role         string    `gorm:"type:varchar(20);not null" json:"role"`
	IsActive     bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

// Student represents an enrolled academic student
type Student struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:uuid;unique;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	RollNumber string    `gorm:"type:varchar(50);unique;not null" json:"roll_number"`
	Department string    `gorm:"type:varchar(100);not null" json:"department"`
	Semester   int       `gorm:"not null" json:"semester"`
	Section    string    `gorm:"type:varchar(20);not null" json:"section"`
	ClassID    *string   `gorm:"type:uuid" json:"class_id,omitempty"`
	Class      *Class    `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (Student) TableName() string {
	return "students"
}

// Teacher represents a faculty instructor
type Teacher struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:uuid;unique;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	EmployeeID string    `gorm:"type:varchar(50);unique;not null" json:"employee_id"`
	Department string    `gorm:"type:varchar(100);not null" json:"department"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (Teacher) TableName() string {
	return "teachers"
}

// Subject represents an academic course module
type Subject struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name       string    `gorm:"type:varchar(150);not null" json:"name"`
	Code       string    `gorm:"type:varchar(30);unique;not null" json:"code"`
	Department string    `gorm:"type:varchar(100);not null" json:"department"`
	Semester   int       `gorm:"not null" json:"semester"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (Subject) TableName() string {
	return "subjects"
}

// Class represents an academic class batch
type Class struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Department   string    `gorm:"type:varchar(100);not null" json:"department"`
	Semester     int       `gorm:"not null" json:"semester"`
	Section      string    `gorm:"type:varchar(20);not null" json:"section"`
	AcademicYear string    `gorm:"type:varchar(20);not null" json:"academic_year"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Class) TableName() string {
	return "classes"
}

// TeacherSubjectClass represents the assignment: Teacher teaches Subject to Class
type TeacherSubjectClass struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TeacherID string    `gorm:"type:uuid;not null" json:"teacher_id"`
	Teacher   Teacher   `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	SubjectID string    `gorm:"type:uuid;not null" json:"subject_id"`
	Subject   Subject   `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	ClassID   string    `gorm:"type:uuid;not null" json:"class_id"`
	Class     Class     `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (TeacherSubjectClass) TableName() string {
	return "teacher_subject_classes"
}

// UserSafeResponse represents sanitized user information without password hash
type UserSafeResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
}

// StudentResponse represents formatted student directory record
type StudentResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	RollNumber  string    `json:"roll_number"`
	Department  string    `json:"department"`
	Semester    int       `json:"semester"`
	Section     string    `json:"section"`
	ClassID     *string   `json:"class_id,omitempty"`
	ClassName   *string   `json:"class_name,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// TeacherResponse represents formatted teacher directory record
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

// SubjectResponse represents formatted subject response
type SubjectResponse struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Code       string    `json:"code"`
	Department string    `json:"department"`
	Semester   int       `json:"semester"`
	CreatedAt  time.Time `json:"created_at"`
}

// ClassResponse represents formatted class response with calculated student count
type ClassResponse struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Department   string    `json:"department"`
	Semester     int       `json:"semester"`
	Section      string    `json:"section"`
	AcademicYear string    `json:"academic_year"`
	StudentCount int64     `json:"student_count"`
	CreatedAt    time.Time `json:"created_at"`
}

// ClassBriefResponse represents brief class info for student profile
type ClassBriefResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Department   string `json:"department"`
	Semester     int    `json:"semester"`
	Section      string `json:"section"`
	AcademicYear string `json:"academic_year"`
}

// AssignmentResponse represents formatted teaching assignment record
type AssignmentResponse struct {
	ID                string    `json:"id"`
	TeacherID         string    `json:"teacher_id"`
	TeacherName       string    `json:"teacher_name"`
	TeacherEmployeeID string    `json:"teacher_employee_id"`
	SubjectID         string    `json:"subject_id"`
	SubjectName       string    `json:"subject_name"`
	SubjectCode       string    `json:"subject_code"`
	ClassID           string    `json:"class_id"`
	ClassName         string    `json:"class_name"`
	Department        string    `json:"department"`
	Semester          int       `json:"semester"`
	Section           string    `json:"section"`
	AcademicYear      string    `json:"academic_year"`
	CreatedAt         time.Time `json:"created_at"`
}

// TeacherAssignmentItem represents assignment viewed from teacher's personal portal
type TeacherAssignmentItem struct {
	AssignmentID string `json:"assignment_id"`
	SubjectID    string `json:"subject_id"`
	Subject      string `json:"subject"`
	Code         string `json:"code"`
	ClassID      string `json:"class_id"`
	Class        string `json:"class"`
	Department   string `json:"department"`
	Semester     int    `json:"semester"`
	Section      string `json:"section"`
	AcademicYear string `json:"academic_year"`
}

// TeacherProfileResponse represents teacher portal profile
type TeacherProfileResponse struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	EmployeeID string `json:"employee_id"`
	Department string `json:"department"`
	IsActive   bool   `json:"is_active"`
}

// StudentProfileResponse represents student portal profile
type StudentProfileResponse struct {
	ID         string              `json:"id"`
	UserID     string              `json:"user_id"`
	Name       string              `json:"name"`
	Email      string              `json:"email"`
	RollNumber string              `json:"roll_number"`
	Department string              `json:"department"`
	Semester   int                 `json:"semester"`
	Section    string              `json:"section"`
	Class      *ClassBriefResponse `json:"class,omitempty"`
}

// DashboardStatsResponse represents extended Admin Dashboard metrics
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
	Subjects struct {
		Total int64 `json:"total"`
	} `json:"subjects"`
	Classes struct {
		Total int64 `json:"total"`
	} `json:"classes"`
	RecentAssignments []AssignmentResponse `json:"recent_assignments"`
}

// AttendanceSession represents a live or past QR attendance session initiated by a teacher
type AttendanceSession struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TeacherID    string    `gorm:"type:uuid;not null" json:"teacher_id"`
	Teacher      Teacher   `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	SubjectID    string    `gorm:"type:uuid;not null" json:"subject_id"`
	Subject      Subject   `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	ClassID      string    `gorm:"type:uuid;not null" json:"class_id"`
	Class        Class     `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	SessionToken string    `gorm:"type:text;unique;not null" json:"session_token"`
	StartedAt    time.Time `gorm:"not null" json:"started_at"`
	ExpiresAt    time.Time `gorm:"not null" json:"expires_at"`
	IsActive     bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

func (AttendanceSession) TableName() string {
	return "attendance_sessions"
}

// Attendance represents a verified attendance record submitted by a student
type Attendance struct {
	ID        string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID string            `gorm:"type:uuid;not null" json:"session_id"`
	Session   AttendanceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	StudentID string            `gorm:"type:uuid;not null" json:"student_id"`
	Student   Student           `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	MarkedAt  time.Time         `gorm:"not null" json:"marked_at"`
	Status    string            `gorm:"type:varchar(20);default:'PRESENT';not null" json:"status"`
	CreatedAt time.Time         `json:"created_at"`
}

// TableName overrides GORM's default pluralized table name "attendances" to match PostgreSQL migration "attendance"
func (Attendance) TableName() string {
	return "attendance"
}

// AttendanceSessionResponse represents formatted attendance session for UI
type AttendanceSessionResponse struct {
	ID                string    `json:"id"`
	TeacherID         string    `json:"teacher_id"`
	TeacherName       string    `json:"teacher_name"`
	TeacherEmployeeID string    `json:"teacher_employee_id"`
	SubjectID         string    `json:"subject_id"`
	SubjectName       string    `json:"subject_name"`
	SubjectCode       string    `json:"subject_code"`
	ClassID           string    `json:"class_id"`
	ClassName         string    `json:"class_name"`
	Department        string    `json:"department"`
	Semester          int       `json:"semester"`
	Section           string    `json:"section"`
	AcademicYear      string    `json:"academic_year"`
	SessionToken      string    `json:"session_token"`
	StartedAt         time.Time `json:"started_at"`
	ExpiresAt         time.Time `json:"expires_at"`
	IsActive          bool      `json:"is_active"`
	IsExpired         bool      `json:"is_expired"`
	PresentCount      int64     `json:"present_count"`
	TotalStudents     int64     `json:"total_students"`
	Percentage        float64   `json:"percentage"`
	CreatedAt         time.Time `json:"created_at"`
}

// AttendanceStudentRecord represents individual student attendance status in a session
type AttendanceStudentRecord struct {
	StudentID  string     `json:"student_id"`
	RollNumber string     `json:"roll_number"`
	Name       string     `json:"name"`
	Email      string     `json:"email"`
	Status     string     `json:"status"` // PRESENT or ABSENT
	MarkedAt   *time.Time `json:"marked_at,omitempty"`
}

// SessionAttendanceDetailsResponse represents complete session summary and full roster
type SessionAttendanceDetailsResponse struct {
	Session       AttendanceSessionResponse `json:"session"`
	Records       []AttendanceStudentRecord `json:"records"`
	PresentCount  int64                     `json:"present_count"`
	TotalStudents int64                     `json:"total_students"`
	Percentage    float64                   `json:"percentage"`
}

// MarkAttendanceResponse represents student scan confirmation data
type MarkAttendanceResponse struct {
	MarkedAt    time.Time `json:"marked_at"`
	SubjectName string    `json:"subject_name"`
	SubjectCode string    `json:"subject_code"`
	ClassName   string    `json:"class_name"`
	Status      string    `json:"status"`
}

// SubjectAttendanceStat represents student attendance in a single course module
type SubjectAttendanceStat struct {
	SubjectID       string  `json:"subject_id"`
	SubjectName     string  `json:"subject_name"`
	SubjectCode     string  `json:"subject_code"`
	PresentSessions int64   `json:"present_sessions"`
	TotalSessions   int64   `json:"total_sessions"`
	Percentage      float64 `json:"percentage"`
}

// StudentAttendanceSummary represents overall and subject-wise metrics for student portal
type StudentAttendanceSummary struct {
	OverallPercentage float64                 `json:"overall_percentage"`
	TotalSessions     int64                   `json:"total_sessions"`
	TotalPresent      int64                   `json:"total_present"`
	Subjects          []SubjectAttendanceStat `json:"subjects"`
}

// StudentRecentAttendanceItem represents recent attendance log entry
type StudentRecentAttendanceItem struct {
	SessionID   string    `json:"session_id"`
	SubjectName string    `json:"subject_name"`
	SubjectCode string    `json:"subject_code"`
	ClassName   string    `json:"class_name"`
	MarkedAt    time.Time `json:"marked_at"`
	Status      string    `json:"status"`
}
