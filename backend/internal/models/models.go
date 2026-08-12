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
	ID                   string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TeacherID            string     `gorm:"type:uuid;not null" json:"teacher_id"`
	Teacher              Teacher    `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	SubjectID            string     `gorm:"type:uuid;not null" json:"subject_id"`
	Subject              Subject    `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	ClassID              string     `gorm:"type:uuid;not null" json:"class_id"`
	Class                Class      `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	SessionToken         string     `gorm:"type:text;unique;not null" json:"session_token"`
	StartedAt            time.Time  `gorm:"not null" json:"started_at"`
	ExpiresAt            time.Time  `gorm:"not null" json:"expires_at"`
	LateThresholdMinutes int        `gorm:"default:10;not null" json:"late_threshold_minutes"`
	FinalizationStatus   string     `gorm:"type:varchar(20);default:'OPEN';not null" json:"finalization_status"`
	FinalizedAt          *time.Time `gorm:"type:timestamp with time zone" json:"finalized_at,omitempty"`
	FinalizedByID        *string    `gorm:"column:finalized_by;type:uuid" json:"finalized_by_id,omitempty"`
	FinalizedBy          *User      `gorm:"foreignKey:FinalizedByID" json:"finalized_by,omitempty"`
	IsActive             bool       `gorm:"default:true;not null" json:"is_active"`
	CreatedAt            time.Time  `json:"created_at"`
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
	ID                   string     `json:"id"`
	TeacherID            string     `json:"teacher_id"`
	TeacherName          string     `json:"teacher_name"`
	TeacherEmployeeID    string     `json:"teacher_employee_id"`
	SubjectID            string     `json:"subject_id"`
	SubjectName          string     `json:"subject_name"`
	SubjectCode          string     `json:"subject_code"`
	ClassID              string     `json:"class_id"`
	ClassName            string     `json:"class_name"`
	Department           string     `json:"department"`
	Semester             int        `json:"semester"`
	Section              string     `json:"section"`
	AcademicYear         string     `json:"academic_year"`
	SessionToken         string     `json:"session_token"`
	StartedAt            time.Time  `json:"started_at"`
	ExpiresAt            time.Time  `json:"expires_at"`
	DurationMinutes      int        `json:"duration_minutes"`
	LateThresholdMinutes int        `json:"late_threshold_minutes"`
	LateAfter            time.Time  `json:"late_after"`
	FinalizationStatus   string     `json:"finalization_status"`
	FinalizedAt          *time.Time `json:"finalized_at,omitempty"`
	FinalizedBy          *string    `json:"finalized_by,omitempty"`
	FinalizedByName      *string    `json:"finalized_by_name,omitempty"`
	IsActive             bool       `json:"is_active"`
	IsExpired            bool       `json:"is_expired"`
	PresentCount         int64      `json:"present_count"`
	LateCount            int64      `json:"late_count"`
	AbsentCount          int64      `json:"absent_count"`
	TotalStudents        int64      `json:"total_students"`
	Percentage           float64    `json:"percentage"`
	LatePercentage       float64    `json:"late_percentage"`
	Status               string     `json:"status"` // "ACTIVE", "COMPLETED", "EXPIRED"
	CreatedAt            time.Time  `json:"created_at"`
}

// Attendance Status, Lifecycle & Action Constants (Features #11, #12 & #13)
const (
	AuditActionManualMark        = "MANUAL_MARK"
	AuditActionCorrection        = "CORRECTION"
	StatusPresent                = "PRESENT"
	StatusLate                   = "LATE"
	StatusAbsent                 = "ABSENT"
	SessionStatusOpen            = "OPEN"
	SessionStatusFinalized       = "FINALIZED"
	SessionFinalizationOpen      = "OPEN"
	SessionFinalizationFinalized = "FINALIZED"
	SessionAuditActionFinalize   = "FINALIZE"
	SessionAuditActionReopen     = "REOPEN"
)

// FinalizeSessionRequest represents optional reason input when finalizing an attendance session
type FinalizeSessionRequest struct {
	Reason string `json:"reason,omitempty"`
}

// FinalizeSessionResponse represents output after finalizing an attendance session
type FinalizeSessionResponse struct {
	SessionID          string     `json:"session_id"`
	FinalizationStatus string     `json:"finalization_status"`
	FinalizedAt        *time.Time `json:"finalized_at"`
	FinalizedBy        *string    `json:"finalized_by"`
	FinalizedByName    *string    `json:"finalized_by_name,omitempty"`
}

// ReopenSessionRequest represents mandatory reason input when reopening a finalized attendance session
type ReopenSessionRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// ReopenSessionResponse represents output after reopening an attendance session
type ReopenSessionResponse struct {
	SessionID          string    `json:"session_id"`
	FinalizationStatus string    `json:"finalization_status"`
	ReopenedAt         time.Time `json:"reopened_at"`
	ReopenedBy         string    `json:"reopened_by"`
	ReopenedByName     string    `json:"reopened_by_name"`
	Reason             string    `json:"reason"`
}

// SessionAuditItem represents sanitized session lifecycle audit item returned by API
type SessionAuditItem struct {
	ID             string    `json:"id"`
	CollegeID      *string   `json:"college_id,omitempty"`
	SessionID      string    `json:"session_id"`
	ActorUserID    string    `json:"actor_user_id"`
	ActorName      string    `json:"actor_name"`
	ActorRole      string    `json:"actor_role"`
	Action         string    `json:"action"` // "FINALIZE" or "REOPEN"
	PreviousStatus *string   `json:"previous_status,omitempty"`
	NewStatus      string    `json:"new_status"`
	Reason         *string   `json:"reason,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// AttendanceSessionAudit represents an immutable session lifecycle event in the database
type AttendanceSessionAudit struct {
	ID             string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CollegeID      *string           `gorm:"type:uuid" json:"college_id,omitempty"`
	SessionID      string            `gorm:"type:uuid;not null" json:"session_id"`
	Session        AttendanceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	ActorUserID    string            `gorm:"type:uuid;not null" json:"actor_user_id"`
	ActorUser      User              `gorm:"foreignKey:ActorUserID" json:"actor_user,omitempty"`
	ActorRole      string            `gorm:"type:varchar(20);not null" json:"actor_role"`
	Action         string            `gorm:"type:varchar(30);not null" json:"action"`
	PreviousStatus *string           `gorm:"type:varchar(20)" json:"previous_status,omitempty"`
	NewStatus      string            `gorm:"type:varchar(20);not null" json:"new_status"`
	Reason         *string           `gorm:"type:text" json:"reason,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
}

func (AttendanceSessionAudit) TableName() string {
	return "attendance_session_audit"
}

// UpdateLateSettingsRequest represents input to modify session late threshold
type UpdateLateSettingsRequest struct {
	LateThresholdMinutes *int `json:"late_threshold_minutes" binding:"required"`
}

// UpdateLateSettingsResponse represents safe output after updating late threshold
type UpdateLateSettingsResponse struct {
	SessionID            string    `json:"session_id"`
	LateThresholdMinutes int       `json:"late_threshold_minutes"`
	LateAfter            time.Time `json:"late_after"`
}

// AttendanceAudit represents an immutable change record in the attendance audit trail
type AttendanceAudit struct {
	ID             string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CollegeID      *string           `gorm:"type:uuid" json:"college_id,omitempty"`
	AttendanceID   *string           `gorm:"type:uuid" json:"attendance_id,omitempty"`
	Attendance     *Attendance       `gorm:"foreignKey:AttendanceID" json:"attendance,omitempty"`
	SessionID      string            `gorm:"type:uuid;not null" json:"session_id"`
	Session        AttendanceSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
	StudentID      string            `gorm:"type:uuid;not null" json:"student_id"`
	Student        Student           `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	ActorUserID    string            `gorm:"type:uuid;not null" json:"actor_user_id"`
	ActorUser      User              `gorm:"foreignKey:ActorUserID" json:"actor_user,omitempty"`
	ActorRole      string            `gorm:"type:varchar(20);not null" json:"actor_role"`
	Action         string            `gorm:"type:varchar(50);not null" json:"action"`
	PreviousStatus *string           `gorm:"type:varchar(20)" json:"previous_status,omitempty"`
	NewStatus      string            `gorm:"type:varchar(20);not null" json:"new_status"`
	Reason         string            `gorm:"type:text;not null" json:"reason"`
	CreatedAt      time.Time         `json:"created_at"`
}

func (AttendanceAudit) TableName() string {
	return "attendance_audit"
}

// ManualAttendanceRequest represents input to mark attendance manually for a student
type ManualAttendanceRequest struct {
	SessionID string `json:"session_id" binding:"required"`
	StudentID string `json:"student_id" binding:"required"`
	Status    string `json:"status" binding:"required"`
	Reason    string `json:"reason" binding:"required"`
}

// CorrectAttendanceRequest represents input to correct an existing attendance record
type CorrectAttendanceRequest struct {
	Status string `json:"status" binding:"required"`
	Reason string `json:"reason" binding:"required"`
}

// AttendanceAuditItem represents sanitized audit trail record returned by API
type AttendanceAuditItem struct {
	ID             string    `json:"id"`
	CollegeID      *string   `json:"college_id,omitempty"`
	AttendanceID   *string   `json:"attendance_id,omitempty"`
	SessionID      string    `json:"session_id"`
	StudentID      string    `json:"student_id"`
	ActorUserID    string    `json:"actor_user_id"`
	ActorName      string    `json:"actor_name"`
	ActorRole      string    `json:"actor_role"`
	Action         string    `json:"action"`
	PreviousStatus *string   `json:"previous_status"`
	NewStatus      string    `json:"new_status"`
	Reason         string    `json:"reason"`
	CreatedAt      time.Time `json:"created_at"`
}

// ManualAttendanceResponse represents safe response after manual mark or correction
type ManualAttendanceResponse struct {
	AttendanceID string    `json:"attendance_id"`
	SessionID    string    `json:"session_id"`
	StudentID    string    `json:"student_id"`
	Status       string    `json:"status"`
	MarkedAt     time.Time `json:"marked_at"`
	Action       string    `json:"action"`
	Reason       string    `json:"reason"`
}

// AttendanceStudentRecord represents individual student attendance status in a session
type AttendanceStudentRecord struct {
	AttendanceID *string    `json:"attendance_id,omitempty"`
	StudentID    string     `json:"student_id"`
	RollNumber   string     `json:"roll_number"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	Status       string     `json:"status"` // PRESENT or ABSENT
	MarkedAt     *time.Time `json:"marked_at,omitempty"`
}

// SessionAttendanceDetailsResponse represents complete session summary and full roster
type SessionAttendanceDetailsResponse struct {
	Session        AttendanceSessionResponse `json:"session"`
	Records        []AttendanceStudentRecord `json:"records"`
	PresentCount   int64                     `json:"present_count"`
	LateCount      int64                     `json:"late_count"`
	TotalStudents  int64                     `json:"total_students"`
	Percentage     float64                   `json:"percentage"`
	LatePercentage float64                   `json:"late_percentage"`
}

// LiveAttendanceSessionResponse represents live polling telemetry for an active attendance session
type LiveAttendanceSessionResponse struct {
	SessionID            string                    `json:"session_id"`
	Status               string                    `json:"status"` // "ACTIVE", "COMPLETED", "EXPIRED"
	TotalStudents        int64                     `json:"total_students"`
	PresentCount         int64                     `json:"present_count"`
	LateCount            int64                     `json:"late_count"`
	AbsentCount          int64                     `json:"absent_count"`
	AttendancePercentage float64                   `json:"attendance_percentage"`
	LatePercentage       float64                   `json:"late_percentage"`
	LateThresholdMinutes int                       `json:"late_threshold_minutes"`
	LateAfter            time.Time                 `json:"late_after"`
	FinalizationStatus   string                    `json:"finalization_status"`
	FinalizedAt          *time.Time                `json:"finalized_at,omitempty"`
	FinalizedBy          *string                   `json:"finalized_by,omitempty"`
	FinalizedByName      *string                   `json:"finalized_by_name,omitempty"`
	QRExpiresAt          time.Time                 `json:"qr_expires_at"`
	StartedAt            time.Time                 `json:"started_at"`
	DurationMinutes      int                       `json:"duration_minutes"`
	IsActive             bool                      `json:"is_active"`
	IsExpired            bool                      `json:"is_expired"`
	SubjectName          string                    `json:"subject_name"`
	SubjectCode          string                    `json:"subject_code"`
	ClassName            string                    `json:"class_name"`
	Semester             int                       `json:"semester"`
	Section              string                    `json:"section"`
	Students             []AttendanceStudentRecord `json:"students"`
}

// MarkAttendanceResponse represents student scan confirmation data
type MarkAttendanceResponse struct {
	AttendanceID         string    `json:"attendance_id,omitempty"`
	ProofID              string    `json:"proof_id,omitempty"`
	ProofPublicID        string    `json:"proof_public_id,omitempty"`
	SessionID            string    `json:"session_id,omitempty"`
	MarkedAt             time.Time `json:"marked_at"`
	SubjectName          string    `json:"subject_name"`
	SubjectCode          string    `json:"subject_code"`
	ClassName            string    `json:"class_name"`
	Status               string    `json:"status"` // "PRESENT" or "LATE"
	LateThresholdMinutes int       `json:"late_threshold_minutes"`
	LateAfter            time.Time `json:"late_after,omitempty"`
}

// ==============================================================================
// ATTENDANCE PROOF & DIGITAL RECEIPT MODELS (Feature #14)
// ==============================================================================

// AttendanceProof represents a verifiable digital receipt identity for an attendance record
type AttendanceProof struct {
	ID           string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttendanceID string      `gorm:"type:uuid;unique;not null" json:"attendance_id"`
	Attendance   *Attendance `gorm:"foreignKey:AttendanceID" json:"attendance,omitempty"`
	PublicID     string      `gorm:"type:varchar(50);unique;not null" json:"public_id"`
	CollegeID    *string     `gorm:"type:uuid" json:"college_id,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

func (AttendanceProof) TableName() string {
	return "attendance_proofs"
}

// AttendanceProofResponse represents the full institutional attendance receipt payload
type AttendanceProofResponse struct {
	ProofID              string    `json:"proof_id"`
	PublicID             string    `json:"public_id"`
	VerificationURL      string    `json:"verification_url"`
	VerificationStatus   string    `json:"verification_status"`
	AttendanceID         string    `json:"attendance_id"`
	StudentID            string    `json:"student_id"`
	StudentName          string    `json:"student_name"`
	RollNumber           string    `json:"roll_number"`
	Email                string    `json:"email"`
	Department           string    `json:"department"`
	Semester             int       `json:"semester"`
	Section              string    `json:"section"`
	ClassName            string    `json:"class_name"`
	SubjectID            string    `json:"subject_id"`
	SubjectName          string    `json:"subject_name"`
	SubjectCode          string    `json:"subject_code"`
	TeacherName          string    `json:"teacher_name"`
	TeacherDepartment    string    `json:"teacher_department"`
	SessionID            string    `json:"session_id"`
	SessionDate          string    `json:"session_date"`
	SessionStartTime     string    `json:"session_start_time"`
	SessionEndTime       string    `json:"session_end_time"`
	AttendanceMarkedAt   time.Time `json:"attendance_marked_at"`
	AttendanceStatus     string    `json:"attendance_status"`
	StatusLabel          string    `json:"status_label"`
	LateThresholdMinutes int       `json:"late_threshold_minutes"`
	CollegeName          string    `json:"college_name"`
	GeneratedAt          time.Time `json:"generated_at"`
}

// AttendanceProofPublicVerificationResponse represents the sanitized public verification response
type AttendanceProofPublicVerificationResponse struct {
	Valid              bool       `json:"valid"`
	VerificationStatus string     `json:"verification_status"` // "VALID" or "INVALID"
	PublicID           string     `json:"public_id,omitempty"`
	StudentName        string     `json:"student_name,omitempty"`
	RollNumber         string     `json:"roll_number,omitempty"`
	Department         string     `json:"department,omitempty"`
	ClassName          string     `json:"class_name,omitempty"`
	SubjectName        string     `json:"subject_name,omitempty"`
	SubjectCode        string     `json:"subject_code,omitempty"`
	SessionDate        string     `json:"session_date,omitempty"`
	AttendanceMarkedAt *time.Time `json:"attendance_marked_at,omitempty"`
	AttendanceStatus   string     `json:"attendance_status,omitempty"`
	StatusLabel        string     `json:"status_label,omitempty"`
	CollegeName        string     `json:"college_name,omitempty"`
	VerifiedAt         time.Time  `json:"verified_at"`
	Message            string     `json:"message"`
}

// SubjectAttendanceStat represents student attendance in a single course module
type SubjectAttendanceStat struct {
	SubjectID       string  `json:"subject_id"`
	SubjectName     string  `json:"subject_name"`
	SubjectCode     string  `json:"subject_code"`
	PresentSessions int64   `json:"present_sessions"`
	LateSessions    int64   `json:"late_sessions"`
	AbsentSessions  int64   `json:"absent_sessions"`
	TotalSessions   int64   `json:"total_sessions"`
	Percentage      float64 `json:"percentage"`
	LatePercentage  float64 `json:"late_percentage"`
}

// StudentAttendanceSummary represents overall and subject-wise metrics for student portal
type StudentAttendanceSummary struct {
	OverallPercentage float64                 `json:"overall_percentage"`
	TotalSessions     int64                   `json:"total_sessions"`
	TotalPresent      int64                   `json:"total_present"`
	TotalLate         int64                   `json:"total_late"`
	TotalAbsent       int64                   `json:"total_absent"`
	LatePercentage    float64                 `json:"late_percentage"`
	Subjects          []SubjectAttendanceStat `json:"subjects"`
}

// StudentRecentAttendanceItem represents recent attendance log entry
type StudentRecentAttendanceItem struct {
	AttendanceID string    `json:"attendance_id,omitempty"`
	SessionID    string    `json:"session_id"`
	SubjectName  string    `json:"subject_name"`
	SubjectCode  string    `json:"subject_code"`
	ClassName    string    `json:"class_name"`
	MarkedAt     time.Time `json:"marked_at"`
	Status       string    `json:"status"`
}

// StudentCalendarSessionItem represents a single lecture session on a given date for student calendar
type StudentCalendarSessionItem struct {
	SessionID   string     `json:"session_id"`
	SubjectID   string     `json:"subject_id"`
	SubjectName string     `json:"subject_name"`
	SubjectCode string     `json:"subject_code"`
	Status      string     `json:"status"` // "PRESENT", "LATE", or "ABSENT"
	MarkedAt    *time.Time `json:"marked_at"`
	StartedAt   time.Time  `json:"started_at"`
}

// StudentCalendarDay represents attendance metrics and session items for a calendar date
type StudentCalendarDay struct {
	Date     string                       `json:"date"`   // "YYYY-MM-DD"
	Status   string                       `json:"status"` // "PRESENT", "LATE", "ABSENT", "PARTIAL"
	Sessions []StudentCalendarSessionItem `json:"sessions"`
}

// StudentCalendarSummary represents month summary metrics
type StudentCalendarSummary struct {
	SessionsHeld   int64   `json:"sessions_held"`
	Present        int64   `json:"present"`
	Late           int64   `json:"late"`
	Absent         int64   `json:"absent"`
	Percentage     float64 `json:"percentage"`
	LatePercentage float64 `json:"late_percentage"`
}

// StudentCalendarResponse represents the full payload returned by GET /api/student/attendance/calendar
type StudentCalendarResponse struct {
	Month   string                 `json:"month"` // "YYYY-MM"
	Summary StudentCalendarSummary `json:"summary"`
	Days    []StudentCalendarDay   `json:"days"`
}

// StudentAttendanceHistoryRecord represents a single lecture attendance record in history
type StudentAttendanceHistoryRecord struct {
	AttendanceID *string    `json:"attendance_id,omitempty"`
	SessionID    string     `json:"session_id"`
	SubjectID    string     `json:"subject_id"`
	SubjectName  string     `json:"subject_name"`
	SubjectCode  string     `json:"subject_code"`
	ClassID      string     `json:"class_id"`
	ClassName    string     `json:"class_name"`
	StartedAt    time.Time  `json:"started_at"`
	EndedAt      time.Time  `json:"ended_at"`
	Status       string     `json:"status"` // "PRESENT", "LATE", or "ABSENT"
	MarkedAt     *time.Time `json:"marked_at"`
}

// StudentAttendanceHistoryPagination represents server-side pagination metadata
type StudentAttendanceHistoryPagination struct {
	Page         int   `json:"page"`
	Limit        int   `json:"limit"`
	TotalRecords int64 `json:"total_records"`
	TotalPages   int   `json:"total_pages"`
}

// StudentAttendanceHistorySummary represents overall metrics for the filtered history
type StudentAttendanceHistorySummary struct {
	Total          int64   `json:"total"`
	Present        int64   `json:"present"`
	Late           int64   `json:"late"`
	Absent         int64   `json:"absent"`
	Percentage     float64 `json:"percentage"`
	LatePercentage float64 `json:"late_percentage"`
}

// StudentAttendanceHistoryResponse represents the full payload of GET /api/student/attendance/history
type StudentAttendanceHistoryResponse struct {
	Records    []StudentAttendanceHistoryRecord   `json:"records"`
	Pagination StudentAttendanceHistoryPagination `json:"pagination"`
	Summary    StudentAttendanceHistorySummary    `json:"summary"`
}

// StudentAttendanceAnalyticsSummary represents high-level metrics for student analytics
type StudentAttendanceAnalyticsSummary struct {
	OverallPercentage        float64 `json:"overall_percentage"`
	TotalSessions            int64   `json:"total_sessions"`
	TotalPresent             int64   `json:"total_present"`
	TotalLate                int64   `json:"total_late"`
	TotalAbsent              int64   `json:"total_absent"`
	LatePercentage           float64 `json:"late_percentage"`
	TotalSubjects            int64   `json:"total_subjects"`
	SubjectsBelowRequirement int     `json:"subjects_below_requirement"`
	SubjectsCritical         int     `json:"subjects_critical"`
	MinThreshold             float64 `json:"min_threshold"`
	CriticalThreshold        float64 `json:"critical_threshold"`
}

// StudentAttendanceMonthlyStat represents attendance in a single calendar month
type StudentAttendanceMonthlyStat struct {
	Month          string  `json:"month"` // "YYYY-MM"
	Sessions       int64   `json:"sessions"`
	Present        int64   `json:"present"`
	Late           int64   `json:"late"`
	Absent         int64   `json:"absent"`
	Percentage     float64 `json:"percentage"`
	LatePercentage float64 `json:"late_percentage"`
}

// StudentAttendanceAnalyticsSubject represents individual course module analytics
type StudentAttendanceAnalyticsSubject struct {
	SubjectID       string  `json:"subject_id"`
	SubjectName     string  `json:"subject_name"`
	SubjectCode     string  `json:"subject_code"`
	TotalSessions   int64   `json:"total_sessions"`
	PresentSessions int64   `json:"present_sessions"`
	LateSessions    int64   `json:"late_sessions"`
	AbsentSessions  int64   `json:"absent_sessions"`
	Percentage      float64 `json:"percentage"`
	LatePercentage  float64 `json:"late_percentage"`
	Status          string  `json:"status"` // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// StudentAttendanceTrend represents month-over-month trajectory
type StudentAttendanceTrend struct {
	Status                     string   `json:"status"` // "IMPROVING", "DECLINING", "STABLE", "INSUFFICIENT_DATA"
	DifferencePercentagePoints float64  `json:"difference_percentage_points"`
	PreviousPercentage         *float64 `json:"previous_percentage"`
	CurrentPercentage          *float64 `json:"current_percentage"`
}

// StudentAttendanceProjection represents consecutive classes needed to reach 75%
type StudentAttendanceProjection struct {
	RequiredPercentage   float64 `json:"required_percentage"`
	ClassesNeeded        *int    `json:"classes_needed"` // nil if total_sessions == 0
	IsMeetingRequirement bool    `json:"is_meeting_requirement"`
}

// StudentAttendanceComparison represents best and lowest subjects comparison
type StudentAttendanceComparison struct {
	BestSubjectID              *string  `json:"best_subject_id"`
	BestSubjectName            string   `json:"best_subject_name"`
	BestPercentage             *float64 `json:"best_percentage"`
	LowestSubjectID            *string  `json:"lowest_subject_id"`
	LowestSubjectName          string   `json:"lowest_subject_name"`
	LowestPercentage           *float64 `json:"lowest_percentage"`
	SubjectsMeetingRequirement int      `json:"subjects_meeting_requirement"`
	SubjectsBelowRequirement   int      `json:"subjects_below_requirement"`
	SubjectsCritical           int      `json:"subjects_critical"`
}

// StudentAttendanceAbsenceAnalysis represents absence analytics
type StudentAttendanceAbsenceAnalysis struct {
	TotalAbsent               int64   `json:"total_absent"`
	AbsencePercentage         float64 `json:"absence_percentage"`
	HighestAbsenceSubjectID   *string `json:"highest_absence_subject_id"`
	HighestAbsenceSubjectName string  `json:"highest_absence_subject_name"`
	HighestAbsenceCount       int64   `json:"highest_absence_count"`
	SubjectsAffectedCount     int     `json:"subjects_affected_count"`
}

// StudentAttendanceAnalyticsFilterInfo represents applied query filters
type StudentAttendanceAnalyticsFilterInfo struct {
	SubjectID *string `json:"subject_id,omitempty"`
	From      *string `json:"from,omitempty"`
	To        *string `json:"to,omitempty"`
}

// StudentAttendanceAnalyticsResponse represents the full payload for GET /api/student/attendance/analytics
type StudentAttendanceAnalyticsResponse struct {
	Summary    StudentAttendanceAnalyticsSummary    `json:"summary"`
	Trend      StudentAttendanceTrend               `json:"trend"`
	Projection StudentAttendanceProjection          `json:"projection"`
	Monthly    []StudentAttendanceMonthlyStat       `json:"monthly"`
	Subjects   []StudentAttendanceAnalyticsSubject  `json:"subjects"`
	Comparison StudentAttendanceComparison          `json:"comparison"`
	Absence    StudentAttendanceAbsenceAnalysis     `json:"absence"`
	Filters    StudentAttendanceAnalyticsFilterInfo `json:"filters"`
}

// ==============================================================================
// TEACHER STUDENT ATTENDANCE SEARCH & DETAIL MODELS (Feature #9)
// ==============================================================================

// TeacherStudentSearchItem represents a single student with attendance metrics in teacher search
type TeacherStudentSearchItem struct {
	StudentID            string  `json:"student_id"`
	UserID               string  `json:"user_id"`
	Name                 string  `json:"name"`
	RollNumber           string  `json:"roll_number"`
	Email                string  `json:"email"`
	ClassID              string  `json:"class_id"`
	ClassName            string  `json:"class_name"`
	Department           string  `json:"department"`
	Semester             int     `json:"semester"`
	Section              string  `json:"section"`
	AttendancePercentage float64 `json:"attendance_percentage"`
	Present              int64   `json:"present"`
	Late                 int64   `json:"late"`
	Absent               int64   `json:"absent"`
	TotalSessions        int64   `json:"total_sessions"`
	LatePercentage       float64 `json:"late_percentage"`
	Status               string  `json:"status"` // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// TeacherStudentSearchSummary represents aggregate metrics for the search results
type TeacherStudentSearchSummary struct {
	TotalStudents              int64 `json:"total_students"`
	StudentsMeetingRequirement int   `json:"students_meeting_requirement"`
	StudentsBelowRequirement   int   `json:"students_below_requirement"`
	StudentsCritical           int   `json:"students_critical"`
}

// TeacherStudentSearchPagination represents pagination metadata for student search
type TeacherStudentSearchPagination struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// TeacherStudentSearchResponse represents the payload of GET /api/teacher/students/search
type TeacherStudentSearchResponse struct {
	Items      []TeacherStudentSearchItem     `json:"items"`
	Pagination TeacherStudentSearchPagination `json:"pagination"`
	Summary    TeacherStudentSearchSummary    `json:"summary"`
}

// TeacherStudentBriefInfo represents student identity in attendance detail view
type TeacherStudentBriefInfo struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	RollNumber string `json:"roll_number"`
	Email      string `json:"email"`
	ClassID    string `json:"class_id"`
	ClassName  string `json:"class_name"`
	Department string `json:"department"`
	Semester   int    `json:"semester"`
	Section    string `json:"section"`
}

// TeacherStudentAttendanceDetailSubject represents subject-level attendance in student detail view
type TeacherStudentAttendanceDetailSubject struct {
	SubjectID      string  `json:"subject_id"`
	SubjectName    string  `json:"subject_name"`
	SubjectCode    string  `json:"subject_code"`
	Total          int64   `json:"total"`
	Present        int64   `json:"present"`
	Late           int64   `json:"late"`
	Absent         int64   `json:"absent"`
	Percentage     float64 `json:"percentage"`
	LatePercentage float64 `json:"late_percentage"`
	Status         string  `json:"status"` // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// TeacherStudentAttendanceDetailSummary represents overall metrics in student detail view
type TeacherStudentAttendanceDetailSummary struct {
	OverallPercentage float64 `json:"overall_percentage"`
	TotalSessions     int64   `json:"total_sessions"`
	TotalPresent      int64   `json:"total_present"`
	TotalLate         int64   `json:"total_late"`
	TotalAbsent       int64   `json:"total_absent"`
	LatePercentage    float64 `json:"late_percentage"`
	Status            string  `json:"status"`
}

// TeacherStudentAttendanceDetailHistoryRecord represents a verified attendance session in history
type TeacherStudentAttendanceDetailHistoryRecord struct {
	AttendanceID *string    `json:"attendance_id,omitempty"`
	SessionID    string     `json:"session_id"`
	SubjectID    string     `json:"subject_id"`
	SubjectName  string     `json:"subject_name"`
	SubjectCode  string     `json:"subject_code"`
	StartedAt    time.Time  `json:"started_at"`
	EndedAt      time.Time  `json:"ended_at"`
	Status       string     `json:"status"` // "PRESENT", "LATE", or "ABSENT"
	MarkedAt     *time.Time `json:"marked_at"`
}

// TeacherStudentAttendanceDetailHistory represents paginated history records
type TeacherStudentAttendanceDetailHistory struct {
	Records    []TeacherStudentAttendanceDetailHistoryRecord `json:"records"`
	Pagination StudentAttendanceHistoryPagination            `json:"pagination"`
}

// TeacherStudentAttendanceDetailResponse represents payload of GET /api/teacher/students/:student_id/attendance
type TeacherStudentAttendanceDetailResponse struct {
	Student  TeacherStudentBriefInfo                 `json:"student"`
	Summary  TeacherStudentAttendanceDetailSummary   `json:"summary"`
	Subjects []TeacherStudentAttendanceDetailSubject `json:"subjects"`
	History  TeacherStudentAttendanceDetailHistory   `json:"history"`
}

// ==============================================================================
// TEACHER ATTENDANCE ANALYTICS & CLASS PERFORMANCE INSIGHTS (Feature #15)
// ==============================================================================

// TeacherAttendanceAnalyticsRequest captures query filter parameters
type TeacherAttendanceAnalyticsRequest struct {
	ClassID            *string `form:"class_id"`
	SubjectID          *string `form:"subject_id"`
	From               *string `form:"from"`
	To                 *string `form:"to"`
	Period             *string `form:"period"`              // "today", "this_week", "this_month", "last_7_days", "last_30_days", "current_semester", "custom"
	FinalizationStatus *string `form:"finalization_status"` // "ALL", "OPEN", "FINALIZED"
}

// TeacherAttendanceAnalyticsSummary represents overarching KPIs for a teacher's assigned scope
type TeacherAttendanceAnalyticsSummary struct {
	TotalClasses             int64   `json:"total_classes"`
	TotalSubjects            int64   `json:"total_subjects"`
	TotalStudents            int64   `json:"total_students"`
	TotalSessions            int64   `json:"total_sessions"`
	TotalPresent             int64   `json:"total_present"`
	TotalLate                int64   `json:"total_late"`
	TotalAbsent              int64   `json:"total_absent"`
	TotalAttended            int64   `json:"total_attended"` // Present + Late
	AttendancePercentage     float64 `json:"attendance_percentage"`
	LatePercentage           float64 `json:"late_percentage"`
	BelowRequirementStudents int64   `json:"below_requirement_students"` // < 75%
	CriticalStudents         int64   `json:"critical_students"`          // < 60%
	OpenSessions             int64   `json:"open_sessions"`
	FinalizedSessions        int64   `json:"finalized_sessions"`
}

// TeacherAttendanceClassStat represents class comparison metrics
type TeacherAttendanceClassStat struct {
	ClassID                  string  `json:"class_id"`
	ClassName                string  `json:"class_name"`
	Department               string  `json:"department"`
	Semester                 int     `json:"semester"`
	Section                  string  `json:"section"`
	TotalStudents            int64   `json:"total_students"`
	TotalSessions            int64   `json:"total_sessions"`
	Present                  int64   `json:"present"`
	Late                     int64   `json:"late"`
	Absent                   int64   `json:"absent"`
	AttendancePercentage     float64 `json:"attendance_percentage"`
	LatePercentage           float64 `json:"late_percentage"`
	BelowRequirementStudents int64   `json:"below_requirement_students"`
	CriticalStudents         int64   `json:"critical_students"`
}

// TeacherAttendanceSubjectStat represents subject comparison metrics
type TeacherAttendanceSubjectStat struct {
	SubjectID                string  `json:"subject_id"`
	SubjectName              string  `json:"subject_name"`
	SubjectCode              string  `json:"subject_code"`
	ClassesCount             int64   `json:"classes_count"`
	TotalSessions            int64   `json:"total_sessions"`
	TotalStudents            int64   `json:"total_students"`
	Present                  int64   `json:"present"`
	Late                     int64   `json:"late"`
	Absent                   int64   `json:"absent"`
	AttendancePercentage     float64 `json:"attendance_percentage"`
	LatePercentage           float64 `json:"late_percentage"`
	BelowRequirementStudents int64   `json:"below_requirement_students"`
	CriticalStudents         int64   `json:"critical_students"`
}

// TeacherAttendanceStandingDistribution represents counts of students by standing tier
type TeacherAttendanceStandingDistribution struct {
	RequirementMet   int64 `json:"requirement_met"`   // >= 75%
	BelowRequirement int64 `json:"below_requirement"` // 60% - 74.9%
	Critical         int64 `json:"critical"`          // < 60%
	TotalEvaluated   int64 `json:"total_evaluated"`
}

// TeacherAttendanceStudentStat represents ranked or attention student data
type TeacherAttendanceStudentStat struct {
	StudentID            string  `json:"student_id"`
	UserID               string  `json:"user_id"`
	Name                 string  `json:"name"`
	RollNumber           string  `json:"roll_number"`
	Email                string  `json:"email"`
	ClassID              string  `json:"class_id"`
	ClassName            string  `json:"class_name"`
	Department           string  `json:"department"`
	TotalSessions        int64   `json:"total_sessions"`
	Present              int64   `json:"present"`
	Late                 int64   `json:"late"`
	Absent               int64   `json:"absent"`
	AttendancePercentage float64 `json:"attendance_percentage"`
	LatePercentage       float64 `json:"late_percentage"`
	Status               string  `json:"status"` // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// TeacherAttendanceLateAnalysis represents deep-dive analytics on late attendance
type TeacherAttendanceLateAnalysis struct {
	TotalLate          int64                         `json:"total_late"`
	LatePercentage     float64                       `json:"late_percentage"`
	MostLateStudent    *TeacherAttendanceStudentStat `json:"most_late_student,omitempty"`
	HighestLateClass   *TeacherAttendanceClassStat   `json:"highest_late_class,omitempty"`
	HighestLateSubject *TeacherAttendanceSubjectStat `json:"highest_late_subject,omitempty"`
}

// TeacherAttendanceMonthlyTrend represents attendance trend metrics for a specific month
type TeacherAttendanceMonthlyTrend struct {
	Month                string  `json:"month"`       // "YYYY-MM"
	MonthLabel           string  `json:"month_label"` // "Aug 2026"
	TotalSessions        int64   `json:"total_sessions"`
	Present              int64   `json:"present"`
	Late                 int64   `json:"late"`
	Absent               int64   `json:"absent"`
	AttendancePercentage float64 `json:"attendance_percentage"`
	LatePercentage       float64 `json:"late_percentage"`
}

// TeacherAttendanceWeeklyTrend represents day-of-week attendance distribution
type TeacherAttendanceWeeklyTrend struct {
	DayOfWeek            int     `json:"day_of_week"` // 1=Mon, 2=Tue, ..., 7=Sun
	DayName              string  `json:"day_name"`    // "Monday", "Tuesday", etc.
	TotalSessions        int64   `json:"total_sessions"`
	Present              int64   `json:"present"`
	Late                 int64   `json:"late"`
	Absent               int64   `json:"absent"`
	AttendancePercentage float64 `json:"attendance_percentage"`
	LatePercentage       float64 `json:"late_percentage"`
}

// TeacherAttendanceSessionPerformance represents recent session summary item
type TeacherAttendanceSessionPerformance struct {
	SessionID            string     `json:"session_id"`
	StartedAt            time.Time  `json:"started_at"`
	SubjectID            string     `json:"subject_id"`
	SubjectName          string     `json:"subject_name"`
	SubjectCode          string     `json:"subject_code"`
	ClassID              string     `json:"class_id"`
	ClassName            string     `json:"class_name"`
	TotalStudents        int64      `json:"total_students"`
	Present              int64      `json:"present"`
	Late                 int64      `json:"late"`
	Absent               int64      `json:"absent"`
	AttendancePercentage float64    `json:"attendance_percentage"`
	LatePercentage       float64    `json:"late_percentage"`
	FinalizationStatus   string     `json:"finalization_status"`
	FinalizedAt          *time.Time `json:"finalized_at,omitempty"`
}

// TeacherAttendanceCorrectionSummary represents audit and manual modification metrics
type TeacherAttendanceCorrectionSummary struct {
	TotalManualMarks int64 `json:"total_manual_marks"`
	TotalCorrections int64 `json:"total_corrections"`
	PresentToLate    int64 `json:"present_to_late"`
	LateToPresent    int64 `json:"late_to_present"`
	AbsentToPresent  int64 `json:"absent_to_present"`
	AbsentToLate     int64 `json:"absent_to_late"`
	OtherCorrections int64 `json:"other_corrections"`
}

// TeacherAttendanceAnalyticsFilterInfo echoes back applied filters
type TeacherAttendanceAnalyticsFilterInfo struct {
	ClassID            *string `json:"class_id"`
	ClassName          *string `json:"class_name"`
	SubjectID          *string `json:"subject_id"`
	SubjectName        *string `json:"subject_name"`
	From               *string `json:"from"`
	To                 *string `json:"to"`
	Period             string  `json:"period"`
	FinalizationStatus string  `json:"finalization_status"`
}

// TeacherAttendanceAnalyticsResponse represents the full payload of GET /api/teacher/attendance/analytics
type TeacherAttendanceAnalyticsResponse struct {
	Summary           TeacherAttendanceAnalyticsSummary     `json:"summary"`
	MonthlyTrend      []TeacherAttendanceMonthlyTrend       `json:"monthly_trend"`
	WeeklyTrend       []TeacherAttendanceWeeklyTrend        `json:"weekly_trend"`
	Classes           []TeacherAttendanceClassStat          `json:"classes"`
	Subjects          []TeacherAttendanceSubjectStat        `json:"subjects"`
	Distribution      TeacherAttendanceStandingDistribution `json:"distribution"`
	TopStudents       []TeacherAttendanceStudentStat        `json:"top_students"`
	AttentionStudents []TeacherAttendanceStudentStat        `json:"attention_students"`
	LateAnalysis      TeacherAttendanceLateAnalysis         `json:"late_analysis"`
	RecentSessions    []TeacherAttendanceSessionPerformance `json:"recent_sessions"`
	Corrections       TeacherAttendanceCorrectionSummary    `json:"corrections"`
	Filters           TeacherAttendanceAnalyticsFilterInfo  `json:"filters"`
}

// ==============================================================================
// RECENT ACTIVITY & ATTENDANCE ACTIVITY FEED (Feature #16)
// ==============================================================================

type ActivityType string

const (
	ActivityTypeAttendanceMarked    ActivityType = "ATTENDANCE_MARKED"
	ActivityTypeAttendanceLate      ActivityType = "ATTENDANCE_LATE"
	ActivityTypeAttendanceCorrected ActivityType = "ATTENDANCE_CORRECTED"
	ActivityTypeManualAttendance    ActivityType = "MANUAL_ATTENDANCE"
	ActivityTypeSessionStarted      ActivityType = "SESSION_STARTED"
	ActivityTypeSessionFinalized    ActivityType = "SESSION_FINALIZED"
	ActivityTypeSessionReopened     ActivityType = "SESSION_REOPENED"
	ActivityTypeProofGenerated      ActivityType = "ATTENDANCE_PROOF_GENERATED"
	ActivityTypeSessionCompleted    ActivityType = "ATTENDANCE_SESSION_COMPLETED"
)

type ActivitySeverity string

const (
	ActivitySeveritySuccess   ActivitySeverity = "SUCCESS"
	ActivitySeverityWarning   ActivitySeverity = "WARNING"
	ActivitySeverityImportant ActivitySeverity = "IMPORTANT"
	ActivitySeverityInfo      ActivitySeverity = "INFO"
)

// ActivityItem represents a normalized read-only event in the unified activity feed
type ActivityItem struct {
	ID            string           `json:"id"`
	Type          ActivityType     `json:"type"`
	Severity      ActivitySeverity `json:"severity"`
	Title         string           `json:"title"`
	Description   string           `json:"description"`
	ActorName     *string          `json:"actor_name,omitempty"`
	ActorRole     *string          `json:"actor_role,omitempty"`
	StudentName   *string          `json:"student_name,omitempty"`
	StudentRollNo *string          `json:"student_roll_number,omitempty"`
	SubjectName   *string          `json:"subject_name,omitempty"`
	SubjectCode   *string          `json:"subject_code,omitempty"`
	ClassName     *string          `json:"class_name,omitempty"`
	SessionID     *string          `json:"session_id,omitempty"`
	AttendanceID  *string          `json:"attendance_id,omitempty"`
	ProofPublicID *string          `json:"proof_public_id,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
}

// RecentActivityRequest represents query parameters for GET /api/activity/recent
type RecentActivityRequest struct {
	Limit *int    `form:"limit"`
	Page  *int    `form:"page"`
	Type  *string `form:"type"`
	From  *string `form:"from"`
	To    *string `form:"to"`
}

// RecentActivityResponse represents the response payload for GET /api/activity/recent
type RecentActivityResponse struct {
	Activities []ActivityItem `json:"activities"`
	Total      int64          `json:"total"`
	Limit      int            `json:"limit"`
	Page       int            `json:"page"`
}

