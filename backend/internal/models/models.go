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
	DurationMinutes   int       `json:"duration_minutes"`
	IsActive          bool      `json:"is_active"`
	IsExpired         bool      `json:"is_expired"`
	PresentCount      int64     `json:"present_count"`
	AbsentCount       int64     `json:"absent_count"`
	TotalStudents     int64     `json:"total_students"`
	Percentage        float64   `json:"percentage"`
	Status            string    `json:"status"` // "ACTIVE", "COMPLETED", "EXPIRED"
	CreatedAt         time.Time `json:"created_at"`
}

// AttendanceAudit Action Constants (Feature #11)
const (
	AuditActionManualMark = "MANUAL_MARK"
	AuditActionCorrection = "CORRECTION"
	StatusPresent         = "PRESENT"
	StatusAbsent          = "ABSENT"
)

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
	Session       AttendanceSessionResponse `json:"session"`
	Records       []AttendanceStudentRecord `json:"records"`
	PresentCount  int64                     `json:"present_count"`
	TotalStudents int64                     `json:"total_students"`
	Percentage    float64                   `json:"percentage"`
}

// LiveAttendanceSessionResponse represents live polling telemetry for an active attendance session
type LiveAttendanceSessionResponse struct {
	SessionID            string                    `json:"session_id"`
	Status               string                    `json:"status"` // "ACTIVE", "COMPLETED", "EXPIRED"
	TotalStudents        int64                     `json:"total_students"`
	PresentCount         int64                     `json:"present_count"`
	AbsentCount          int64                     `json:"absent_count"`
	AttendancePercentage float64                   `json:"attendance_percentage"`
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
	SessionID   string    `json:"session_id,omitempty"`
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
	AbsentSessions  int64   `json:"absent_sessions"`
	TotalSessions   int64   `json:"total_sessions"`
	Percentage      float64 `json:"percentage"`
}

// StudentAttendanceSummary represents overall and subject-wise metrics for student portal
type StudentAttendanceSummary struct {
	OverallPercentage float64                 `json:"overall_percentage"`
	TotalSessions     int64                   `json:"total_sessions"`
	TotalPresent      int64                   `json:"total_present"`
	TotalAbsent       int64                   `json:"total_absent"`
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

// StudentCalendarSessionItem represents a single lecture session on a given date for student calendar
type StudentCalendarSessionItem struct {
	SessionID   string     `json:"session_id"`
	SubjectID   string     `json:"subject_id"`
	SubjectName string     `json:"subject_name"`
	SubjectCode string     `json:"subject_code"`
	Status      string     `json:"status"` // "PRESENT" or "ABSENT"
	MarkedAt    *time.Time `json:"marked_at"`
	StartedAt   time.Time  `json:"started_at"`
}

// StudentCalendarDay represents attendance metrics and session items for a calendar date
type StudentCalendarDay struct {
	Date     string                       `json:"date"`   // "YYYY-MM-DD"
	Status   string                       `json:"status"` // "PRESENT", "ABSENT", "PARTIAL"
	Sessions []StudentCalendarSessionItem `json:"sessions"`
}

// StudentCalendarSummary represents month summary metrics
type StudentCalendarSummary struct {
	SessionsHeld int64   `json:"sessions_held"`
	Present      int64   `json:"present"`
	Absent       int64   `json:"absent"`
	Percentage   float64 `json:"percentage"`
}

// StudentCalendarResponse represents the full payload returned by GET /api/student/attendance/calendar
type StudentCalendarResponse struct {
	Month   string                 `json:"month"` // "YYYY-MM"
	Summary StudentCalendarSummary `json:"summary"`
	Days    []StudentCalendarDay   `json:"days"`
}

// StudentAttendanceHistoryRecord represents a single lecture attendance record in history
type StudentAttendanceHistoryRecord struct {
	SessionID   string     `json:"session_id"`
	SubjectID   string     `json:"subject_id"`
	SubjectName string     `json:"subject_name"`
	SubjectCode string     `json:"subject_code"`
	ClassID     string     `json:"class_id"`
	ClassName   string     `json:"class_name"`
	StartedAt   time.Time  `json:"started_at"`
	EndedAt     time.Time  `json:"ended_at"`
	Status      string     `json:"status"` // "PRESENT" or "ABSENT"
	MarkedAt    *time.Time `json:"marked_at"`
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
	Total      int64   `json:"total"`
	Present    int64   `json:"present"`
	Absent     int64   `json:"absent"`
	Percentage float64 `json:"percentage"`
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
	TotalAbsent              int64   `json:"total_absent"`
	TotalSubjects            int64   `json:"total_subjects"`
	SubjectsBelowRequirement int     `json:"subjects_below_requirement"`
	SubjectsCritical         int     `json:"subjects_critical"`
	MinThreshold             float64 `json:"min_threshold"`
	CriticalThreshold        float64 `json:"critical_threshold"`
}

// StudentAttendanceMonthlyStat represents attendance in a single calendar month
type StudentAttendanceMonthlyStat struct {
	Month      string  `json:"month"` // "YYYY-MM"
	Sessions   int64   `json:"sessions"`
	Present    int64   `json:"present"`
	Absent     int64   `json:"absent"`
	Percentage float64 `json:"percentage"`
}

// StudentAttendanceAnalyticsSubject represents individual course module analytics
type StudentAttendanceAnalyticsSubject struct {
	SubjectID       string  `json:"subject_id"`
	SubjectName     string  `json:"subject_name"`
	SubjectCode     string  `json:"subject_code"`
	TotalSessions   int64   `json:"total_sessions"`
	PresentSessions int64   `json:"present_sessions"`
	AbsentSessions  int64   `json:"absent_sessions"`
	Percentage      float64 `json:"percentage"`
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
	Summary    StudentAttendanceAnalyticsSummary   `json:"summary"`
	Trend      StudentAttendanceTrend              `json:"trend"`
	Projection StudentAttendanceProjection         `json:"projection"`
	Monthly    []StudentAttendanceMonthlyStat      `json:"monthly"`
	Subjects   []StudentAttendanceAnalyticsSubject `json:"subjects"`
	Comparison StudentAttendanceComparison         `json:"comparison"`
	Absence    StudentAttendanceAbsenceAnalysis    `json:"absence"`
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
	Absent               int64   `json:"absent"`
	TotalSessions        int64   `json:"total_sessions"`
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
	SubjectID   string  `json:"subject_id"`
	SubjectName string  `json:"subject_name"`
	SubjectCode string  `json:"subject_code"`
	Total       int64   `json:"total"`
	Present     int64   `json:"present"`
	Absent      int64   `json:"absent"`
	Percentage  float64 `json:"percentage"`
	Status      string  `json:"status"` // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// TeacherStudentAttendanceDetailSummary represents overall metrics in student detail view
type TeacherStudentAttendanceDetailSummary struct {
	OverallPercentage float64 `json:"overall_percentage"`
	TotalSessions     int64   `json:"total_sessions"`
	TotalPresent      int64   `json:"total_present"`
	TotalAbsent       int64   `json:"total_absent"`
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
	Status       string     `json:"status"` // "PRESENT" or "ABSENT"
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
