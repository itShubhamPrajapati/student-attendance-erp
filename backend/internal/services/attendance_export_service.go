package services

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"math"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"

	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

var (
	ErrExportUnauthorized = errors.New("You are not authorized to export this attendance data.")
	ErrExportNoData       = errors.New("No attendance records found for the selected filters.")
	ErrExportInvalidDate  = errors.New("Invalid date range for export.")
)

// AttendanceExportParams represents filters applied to export reports
type AttendanceExportParams struct {
	Query     string
	ClassID   *string
	SubjectID *string
	Status    *string
	FromDate  *string
	ToDate    *string
	StudentID *string
}

// AttendanceExportRow represents one detailed attendance log row
type AttendanceExportRow struct {
	StudentName          string
	RollNumber           string
	Email                string
	ClassName            string
	Department           string
	Semester             int
	Section              string
	SubjectName          string
	SubjectCode          string
	SessionDate          string
	SessionStartTime     string
	SessionEndTime       string
	AttendanceStatus     string // "PRESENT", "LATE", or "ABSENT"
	MarkedAt             string // "HH:MM:SS" or "—"
	AttendancePercentage float64
}

// AttendanceStudentSummaryRow represents student aggregated metrics
type AttendanceStudentSummaryRow struct {
	StudentID            string
	StudentName          string
	RollNumber           string
	Email                string
	ClassName            string
	TotalSessions        int64
	Present              int64
	Late                 int64
	Absent               int64
	AttendancePercentage float64
	LatePercentage       float64
	Status               string // "REQUIREMENT_MET", "BELOW_REQUIREMENT", "CRITICAL"
}

// AttendanceExportSummary represents aggregate statistics across all matching rows
type AttendanceExportSummary struct {
	TotalStudents              int
	TotalSessions              int64
	TotalPresent               int64
	TotalLate                  int64
	TotalAbsent                int64
	OverallAttendancePct       float64
	LatePercentage             float64
	StudentsMeetingRequirement int
	StudentsBelowRequirement   int
	StudentsCritical           int
}

// AttendanceExportData is the complete normalized data container
type AttendanceExportData struct {
	GeneratedAt time.Time
	GeneratedBy string
	Role        string
	Filters     AttendanceExportParams
	Summary     AttendanceExportSummary
	StudentRows []AttendanceStudentSummaryRow
	DetailRows  []AttendanceExportRow
}

// sanitizeCSVField prevents spreadsheet formula injection (CSV Injection / DDE)
func sanitizeCSVField(val string) string {
	if val == "" {
		return val
	}
	firstChar := val[0]
	if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r' {
		return "'" + val
	}
	trimmed := strings.TrimSpace(val)
	if trimmed == "" {
		return ""
	}
	firstTrimmed := trimmed[0]
	if firstTrimmed == '=' || firstTrimmed == '+' || firstTrimmed == '-' || firstTrimmed == '@' {
		return "'" + trimmed
	}
	return trimmed
}

// GetTeacherAttendanceExportData gathers authoritative, tenant-authorized attendance records for a teacher
func GetTeacherAttendanceExportData(
	db *gorm.DB,
	teacherUserID string,
	params AttendanceExportParams,
) (*AttendanceExportData, error) {
	// 1. Resolve teacher record
	var teacher models.Teacher
	if err := db.Preload("User").Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
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
		return nil, ErrExportNoData
	}

	authorizedClassSet := make(map[string]bool)
	authorizedSubjectSet := make(map[string]bool)
	for _, a := range assignments {
		authorizedClassSet[a.ClassID] = true
		authorizedSubjectSet[a.SubjectID] = true
	}

	// Validate target class IDs
	var targetClassIDs []string
	if params.ClassID != nil && strings.TrimSpace(*params.ClassID) != "" {
		cID := strings.TrimSpace(*params.ClassID)
		if !authorizedClassSet[cID] {
			return nil, ErrExportUnauthorized
		}
		targetClassIDs = []string{cID}
	} else {
		for cID := range authorizedClassSet {
			targetClassIDs = append(targetClassIDs, cID)
		}
	}

	// Validate target subject filter
	var targetSubjectFilter *string
	if params.SubjectID != nil && strings.TrimSpace(*params.SubjectID) != "" {
		sID := strings.TrimSpace(*params.SubjectID)
		if !authorizedSubjectSet[sID] {
			return nil, ErrExportUnauthorized
		}
		targetSubjectFilter = &sID
	}

	// 3. Query students enrolled in target classes
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
			c.section
		`).
		Joins("JOIN users u ON s.user_id = u.id").
		Joins("JOIN classes c ON s.class_id = c.id").
		Where("s.class_id IN ?", targetClassIDs)

	if params.StudentID != nil && strings.TrimSpace(*params.StudentID) != "" {
		studQuery = studQuery.Where("s.id = ?", strings.TrimSpace(*params.StudentID))
	}

	cleanQ := strings.TrimSpace(params.Query)
	if cleanQ != "" {
		likePattern := "%" + strings.ToLower(cleanQ) + "%"
		studQuery = studQuery.Where("(LOWER(u.name) LIKE ? OR LOWER(s.roll_number) LIKE ? OR LOWER(u.email) LIKE ?)", likePattern, likePattern, likePattern)
	}

	var students []studentRow
	if err := studQuery.Order("s.roll_number ASC, u.name ASC").Scan(&students).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch students: %w", err)
	}

	if len(students) == 0 {
		return nil, ErrExportNoData
	}

	studentIDs := make([]string, len(students))
	studentMap := make(map[string]studentRow)
	for i, st := range students {
		studentIDs[i] = st.ID
		studentMap[st.ID] = st
	}

	// 4. Batch query attendance sessions for target classes
	type sessionRow struct {
		ID          string
		ClassID     string
		SubjectID   string
		SubjectName string
		SubjectCode string
		StartedAt   time.Time
		ExpiresAt   time.Time
	}

	sessQuery := db.Table("attendance_sessions s").
		Select(`
			s.id,
			s.class_id,
			s.subject_id,
			sub.name AS subject_name,
			sub.code AS subject_code,
			s.started_at,
			s.expires_at
		`).
		Joins("JOIN subjects sub ON s.subject_id = sub.id").
		Where("s.class_id IN ?", targetClassIDs)

	if targetSubjectFilter != nil {
		sessQuery = sessQuery.Where("s.subject_id = ?", *targetSubjectFilter)
	}
	if params.FromDate != nil && strings.TrimSpace(*params.FromDate) != "" {
		sessQuery = sessQuery.Where("DATE(s.started_at) >= ?", strings.TrimSpace(*params.FromDate))
	}
	if params.ToDate != nil && strings.TrimSpace(*params.ToDate) != "" {
		sessQuery = sessQuery.Where("DATE(s.started_at) <= ?", strings.TrimSpace(*params.ToDate))
	}

	var sessions []sessionRow
	if err := sessQuery.Order("s.started_at DESC").Scan(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance sessions: %w", err)
	}

	if len(sessions) == 0 {
		return nil, ErrExportNoData
	}

	sessionIDs := make([]string, len(sessions))
	classSessionsMap := make(map[string][]sessionRow)
	for i, s := range sessions {
		sessionIDs[i] = s.ID
		classSessionsMap[s.ClassID] = append(classSessionsMap[s.ClassID], s)
	}

	// 5. Batch query attendance records
	type attRow struct {
		StudentID string
		SessionID string
		MarkedAt  time.Time
		Status    string
	}
	var attendanceRecords []attRow
	if len(sessionIDs) > 0 && len(studentIDs) > 0 {
		if err := db.Table("attendance").
			Select("student_id, session_id, marked_at, status").
			Where("student_id IN ? AND session_id IN ?", studentIDs, sessionIDs).
			Scan(&attendanceRecords).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch attendance records: %w", err)
		}
	}

	// student_id -> session_id -> attRow
	studentAttendanceMap := make(map[string]map[string]attRow)
	for _, a := range attendanceRecords {
		if _, exists := studentAttendanceMap[a.StudentID]; !exists {
			studentAttendanceMap[a.StudentID] = make(map[string]attRow)
		}
		studentAttendanceMap[a.StudentID][a.SessionID] = a
	}

	// 6. Aggregate student overall stats
	var studentSummaryRows []AttendanceStudentSummaryRow
	var totalOverallPresent int64
	var totalOverallLate int64
	var totalOverallSessions int64
	var meetingCount, belowCount, criticalCount int

	for _, st := range students {
		classSessList := classSessionsMap[st.ClassID]
		totalSess := int64(len(classSessList))
		presentCount := int64(0)
		lateCount := int64(0)
		for _, att := range studentAttendanceMap[st.ID] {
			if att.Status == "PRESENT" {
				presentCount++
			} else if att.Status == "LATE" {
				lateCount++
			}
		}
		attendedCount := presentCount + lateCount
		absentCount := int64(0)
		if totalSess > attendedCount {
			absentCount = totalSess - attendedCount
		}

		pct := 0.0
		if totalSess > 0 {
			pct = math.Round((float64(attendedCount)/float64(totalSess))*1000) / 10
		}
		latePct := 0.0
		if totalSess > 0 {
			latePct = math.Round((float64(lateCount)/float64(totalSess))*1000) / 10
		}

		standing := "REQUIREMENT_MET"
		if totalSess > 0 {
			if pct >= 75.0 {
				standing = "REQUIREMENT_MET"
				meetingCount++
			} else if pct >= 60.0 {
				standing = "BELOW_REQUIREMENT"
				belowCount++
			} else {
				standing = "CRITICAL"
				criticalCount++
				belowCount++
			}
		} else {
			standing = "REQUIREMENT_MET"
			meetingCount++
		}

		// Apply status filter if specified
		if params.Status != nil && strings.TrimSpace(*params.Status) != "" {
			sf := strings.ToUpper(strings.TrimSpace(*params.Status))
			if sf != "ALL" {
				if sf == "LATE" {
					if lateCount == 0 {
						continue
					}
				} else if sf == "PRESENT" {
					if presentCount == 0 {
						continue
					}
				} else if sf == "ABSENT" {
					if absentCount == 0 {
						continue
					}
				} else if sf == "MET" || sf == "REQUIREMENT_MET" {
					if standing != "REQUIREMENT_MET" {
						continue
					}
				} else if sf == "LOW" || sf == "BELOW_REQUIREMENT" {
					if standing != "BELOW_REQUIREMENT" && standing != "CRITICAL" {
						continue
					}
				} else if sf == "CRITICAL" {
					if standing != "CRITICAL" {
						continue
					}
				}
			}
		}

		totalOverallPresent += presentCount
		totalOverallLate += lateCount
		totalOverallSessions += totalSess

		studentSummaryRows = append(studentSummaryRows, AttendanceStudentSummaryRow{
			StudentID:            st.ID,
			StudentName:          st.Name,
			RollNumber:           st.RollNumber,
			Email:                st.Email,
			ClassName:            st.ClassName,
			TotalSessions:        totalSess,
			Present:              presentCount,
			Late:                 lateCount,
			Absent:               absentCount,
			AttendancePercentage: pct,
			LatePercentage:       latePct,
			Status:               standing,
		})
	}

	if len(studentSummaryRows) == 0 {
		return nil, ErrExportNoData
	}

	// 7. Build detailed attendance session logs
	var detailRows []AttendanceExportRow
	studentSummaryMap := make(map[string]AttendanceStudentSummaryRow)
	for _, sr := range studentSummaryRows {
		studentSummaryMap[sr.StudentID] = sr
	}

	for _, st := range students {
		sr, included := studentSummaryMap[st.ID]
		if !included {
			continue
		}

		classSessList := classSessionsMap[st.ClassID]
		for _, s := range classSessList {
			statusStr := "ABSENT"
			markedAtStr := "—"

			if att, attended := studentAttendanceMap[st.ID][s.ID]; attended {
				if att.Status == "PRESENT" {
					statusStr = "PRESENT"
					if !att.MarkedAt.IsZero() {
						markedAtStr = att.MarkedAt.Format("15:04:05")
					}
				} else if att.Status == "LATE" {
					statusStr = "LATE"
					if !att.MarkedAt.IsZero() {
						markedAtStr = att.MarkedAt.Format("15:04:05")
					}
				}
			}

			detailRows = append(detailRows, AttendanceExportRow{
				StudentName:          st.Name,
				RollNumber:           st.RollNumber,
				Email:                st.Email,
				ClassName:            st.ClassName,
				Department:           st.Department,
				Semester:             st.Semester,
				Section:              st.Section,
				SubjectName:          s.SubjectName,
				SubjectCode:          s.SubjectCode,
				SessionDate:          s.StartedAt.Format("2006-01-02"),
				SessionStartTime:     s.StartedAt.Format("15:04"),
				SessionEndTime:       s.ExpiresAt.Format("15:04"),
				AttendanceStatus:     statusStr,
				MarkedAt:             markedAtStr,
				AttendancePercentage: sr.AttendancePercentage,
			})
		}
	}

	totalOverallAttended := totalOverallPresent + totalOverallLate
	overallPct := 0.0
	if totalOverallSessions > 0 {
		overallPct = math.Round((float64(totalOverallAttended)/float64(totalOverallSessions))*1000) / 10
	}
	overallLatePct := 0.0
	if totalOverallSessions > 0 {
		overallLatePct = math.Round((float64(totalOverallLate)/float64(totalOverallSessions))*1000) / 10
	}

	var totalAbsent int64 = 0
	if totalOverallSessions > totalOverallAttended {
		totalAbsent = totalOverallSessions - totalOverallAttended
	}

	return &AttendanceExportData{
		GeneratedAt: time.Now().UTC(),
		GeneratedBy: teacher.User.Name,
		Role:        models.RoleTeacher,
		Filters:     params,
		Summary: AttendanceExportSummary{
			TotalStudents:              len(studentSummaryRows),
			TotalSessions:              totalOverallSessions,
			TotalPresent:               totalOverallPresent,
			TotalLate:                  totalOverallLate,
			TotalAbsent:                totalAbsent,
			OverallAttendancePct:       overallPct,
			LatePercentage:             overallLatePct,
			StudentsMeetingRequirement: meetingCount,
			StudentsBelowRequirement:   belowCount,
			StudentsCritical:           criticalCount,
		},
		StudentRows: studentSummaryRows,
		DetailRows:  detailRows,
	}, nil
}

// GenerateAttendanceCSV streams standards-compliant UTF-8 CSV with formula injection prevention
func GenerateAttendanceCSV(w io.Writer, data *AttendanceExportData) error {
	// Write UTF-8 Byte Order Mark (BOM) for Excel Windows compatibility
	if _, err := w.Write([]byte("\xef\xbb\xbf")); err != nil {
		return err
	}

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write Headers
	headers := []string{
		"Student Name",
		"Roll Number",
		"Email",
		"Class",
		"Department",
		"Semester",
		"Section",
		"Subject",
		"Subject Code",
		"Session Date",
		"Start Time",
		"End Time",
		"Status",
		"Marked At",
		"Student Overall %",
	}
	if err := writer.Write(headers); err != nil {
		return err
	}

	for _, row := range data.DetailRows {
		record := []string{
			sanitizeCSVField(row.StudentName),
			sanitizeCSVField(row.RollNumber),
			sanitizeCSVField(row.Email),
			sanitizeCSVField(row.ClassName),
			sanitizeCSVField(row.Department),
			fmt.Sprintf("%d", row.Semester),
			sanitizeCSVField(row.Section),
			sanitizeCSVField(row.SubjectName),
			sanitizeCSVField(row.SubjectCode),
			row.SessionDate,
			row.SessionStartTime,
			row.SessionEndTime,
			row.AttendanceStatus,
			row.MarkedAt,
			fmt.Sprintf("%.1f%%", row.AttendancePercentage),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}

	return nil
}

// GenerateAttendanceExcel builds a structured multi-sheet XLSX report with formatting
func GenerateAttendanceExcel(data *AttendanceExportData) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetAttendance := "Attendance Report"
	sheetSummary := "Summary"

	// Rename default Sheet1 to "Attendance Report"
	f.SetSheetName("Sheet1", sheetAttendance)
	f.NewSheet(sheetSummary)

	// --- 1. SHEET: Attendance Report ---
	// Header style: Navy background, bold white text, centered
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1E293B"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: false},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create header style: %w", err)
	}

	centerStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	headers := []string{
		"Student Name", "Roll Number", "Email", "Class", "Department",
		"Semester", "Section", "Subject", "Subject Code", "Session Date",
		"Start Time", "End Time", "Attendance Status", "Marked At", "Overall %",
	}

	for colIdx, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
		f.SetCellValue(sheetAttendance, cell, h)
		f.SetCellStyle(sheetAttendance, cell, cell, headerStyle)
	}
	f.SetRowHeight(sheetAttendance, 1, 26)

	for rowIdx, r := range data.DetailRows {
		rNum := rowIdx + 2
		f.SetCellValue(sheetAttendance, fmt.Sprintf("A%d", rNum), r.StudentName)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("B%d", rNum), r.RollNumber)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("C%d", rNum), r.Email)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("D%d", rNum), r.ClassName)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("E%d", rNum), r.Department)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("F%d", rNum), r.Semester)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("G%d", rNum), r.Section)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("H%d", rNum), r.SubjectName)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("I%d", rNum), r.SubjectCode)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("J%d", rNum), r.SessionDate)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("K%d", rNum), r.SessionStartTime)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("L%d", rNum), r.SessionEndTime)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("M%d", rNum), r.AttendanceStatus)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("N%d", rNum), r.MarkedAt)
		f.SetCellValue(sheetAttendance, fmt.Sprintf("O%d", rNum), fmt.Sprintf("%.1f%%", r.AttendancePercentage))

		f.SetCellStyle(sheetAttendance, fmt.Sprintf("F%d", rNum), fmt.Sprintf("G%d", rNum), centerStyle)
		f.SetCellStyle(sheetAttendance, fmt.Sprintf("J%d", rNum), fmt.Sprintf("O%d", rNum), centerStyle)
	}

	// Freeze top row
	f.SetPanes(sheetAttendance, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	})

	// Set reasonable column widths
	colWidths := map[string]float64{
		"A": 22, "B": 14, "C": 26, "D": 16, "E": 18,
		"F": 10, "G": 10, "H": 24, "I": 14, "J": 14,
		"K": 12, "L": 12, "M": 18, "N": 14, "O": 14,
	}
	for col, w := range colWidths {
		f.SetColWidth(sheetAttendance, col, col, w)
	}

	// --- 2. SHEET: Summary ---
	summaryTitleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14, Color: "0F172A"},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})
	subHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"334155"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
	})
	metricLabelStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "475569"},
	})

	f.SetCellValue(sheetSummary, "A1", "Attendance Report Summary & Statistics")
	f.SetCellStyle(sheetSummary, "A1", "A1", summaryTitleStyle)
	f.SetRowHeight(sheetSummary, 1, 28)

	// Metadata Table
	f.SetCellValue(sheetSummary, "A3", "REPORT METADATA")
	f.SetCellValue(sheetSummary, "B3", "")
	f.MergeCell(sheetSummary, "A3", "B3")
	f.SetCellStyle(sheetSummary, "A3", "B3", subHeaderStyle)

	metaRows := [][2]string{
		{"Generated At (UTC)", data.GeneratedAt.Format("2006-01-02 15:04:05")},
		{"Generated By", data.GeneratedBy},
		{"User Role", data.Role},
		{"Status Filter", func() string {
			if data.Filters.Status != nil && *data.Filters.Status != "" {
				return *data.Filters.Status
			}
			return "All Standings"
		}()},
		{"Date Range", func() string {
			f := "Start"
			t := "End"
			if data.Filters.FromDate != nil && *data.Filters.FromDate != "" {
				f = *data.Filters.FromDate
			}
			if data.Filters.ToDate != nil && *data.Filters.ToDate != "" {
				t = *data.Filters.ToDate
			}
			return f + " to " + t
		}()},
	}

	for idx, m := range metaRows {
		rNum := idx + 4
		f.SetCellValue(sheetSummary, fmt.Sprintf("A%d", rNum), m[0])
		f.SetCellValue(sheetSummary, fmt.Sprintf("B%d", rNum), m[1])
		f.SetCellStyle(sheetSummary, fmt.Sprintf("A%d", rNum), fmt.Sprintf("A%d", rNum), metricLabelStyle)
	}

	// KPI Metrics Table
	kpiStartRow := 11
	f.SetCellValue(sheetSummary, fmt.Sprintf("A%d", kpiStartRow), "ATTENDANCE METRICS")
	f.SetCellValue(sheetSummary, fmt.Sprintf("B%d", kpiStartRow), "")
	f.MergeCell(sheetSummary, fmt.Sprintf("A%d", kpiStartRow), fmt.Sprintf("B%d", kpiStartRow))
	f.SetCellStyle(sheetSummary, fmt.Sprintf("A%d", kpiStartRow), fmt.Sprintf("B%d", kpiStartRow), subHeaderStyle)

	kpiRows := [][2]interface{}{
		{"Total Students Evaluated", data.Summary.TotalStudents},
		{"Total Lecture Sessions", data.Summary.TotalSessions},
		{"Total Present Records", data.Summary.TotalPresent},
		{"Total Late Records", data.Summary.TotalLate},
		{"Total Absent Records", data.Summary.TotalAbsent},
		{"Overall Attendance Percentage (Present + Late)", fmt.Sprintf("%.1f%%", data.Summary.OverallAttendancePct)},
		{"Late Percentage", fmt.Sprintf("%.1f%%", data.Summary.LatePercentage)},
		{"Students Meeting Requirement (>= 75%)", data.Summary.StudentsMeetingRequirement},
		{"Students Below Requirement (60% - 74.9%)", data.Summary.StudentsBelowRequirement},
		{"Students at Critical Level (< 60%)", data.Summary.StudentsCritical},
	}

	for idx, k := range kpiRows {
		rNum := kpiStartRow + 1 + idx
		f.SetCellValue(sheetSummary, fmt.Sprintf("A%d", rNum), k[0])
		f.SetCellValue(sheetSummary, fmt.Sprintf("B%d", rNum), k[1])
		f.SetCellStyle(sheetSummary, fmt.Sprintf("A%d", rNum), fmt.Sprintf("A%d", rNum), metricLabelStyle)
	}

	f.SetColWidth(sheetSummary, "A", "A", 38)
	f.SetColWidth(sheetSummary, "B", "B", 30)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("failed to encode XLSX buffer: %w", err)
	}

	return buf.Bytes(), nil
}

// GenerateAttendancePDF produces a professional, landscape multi-page PDF report
func GenerateAttendancePDF(data *AttendanceExportData) ([]byte, error) {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetTitle("Attendance Report", false)
	pdf.SetAuthor("Student Attendance ERP", false)
	pdf.SetAutoPageBreak(true, 15)

	// Page setup (Landscape A4: 297mm width x 210mm height, margins: 10mm)
	pdf.SetMargins(10, 10, 10)

	pdf.SetFooterFunc(func() {
		pdf.SetY(-12)
		pdf.SetFont("Arial", "I", 8)
		pdf.SetTextColor(148, 163, 184)
		pdf.CellFormat(138, 8, fmt.Sprintf("Confidential • Student Attendance ERP • Generated %s UTC", data.GeneratedAt.Format("2006-01-02 15:04:05")), "", 0, "L", false, 0, "")
		pdf.CellFormat(139, 8, fmt.Sprintf("Page %d of {nb}", pdf.PageNo()), "", 0, "R", false, 0, "")
	})
	pdf.AliasNbPages("{nb}")

	pdf.AddPage()

	// --- 1. REPORT HEADER ---
	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(190, 8, "STUDENT ATTENDANCE REPORT", "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(79, 70, 229)
	pdf.CellFormat(87, 8, "ACADEMIC AUDIT RECORD", "", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 8.5)
	pdf.SetTextColor(100, 116, 139)
	filterDesc := "All Assigned Classes"
	if data.Filters.ClassID != nil && *data.Filters.ClassID != "" {
		filterDesc = "Filtered Class"
	}
	if data.Filters.FromDate != nil && data.Filters.ToDate != nil {
		filterDesc += fmt.Sprintf(" • Date Range: %s to %s", *data.Filters.FromDate, *data.Filters.ToDate)
	}
	pdf.CellFormat(190, 5, fmt.Sprintf("Instructor: %s • %s", data.GeneratedBy, filterDesc), "", 0, "L", false, 0, "")
	pdf.CellFormat(87, 5, fmt.Sprintf("Generated: %s UTC", data.GeneratedAt.Format("2006-01-02 15:04")), "", 1, "R", false, 0, "")

	pdf.Ln(3)

	// --- 2. SUMMARY KPI STATS CARDS ---
	pdf.SetFillColor(248, 250, 252)
	pdf.SetDrawColor(226, 232, 240)
	pdf.Rect(10, pdf.GetY(), 277, 18, "FD")

	cardY := pdf.GetY() + 2
	pdf.SetY(cardY)

	// Column 1: Total Students
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetX(14)
	pdf.CellFormat(60, 4, "TOTAL STUDENTS", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetXY(14, cardY+5)
	pdf.CellFormat(60, 6, fmt.Sprintf("%d Enrolled", data.Summary.TotalStudents), "", 0, "L", false, 0, "")

	// Column 2: Total Sessions & Records
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetXY(80, cardY)
	pdf.CellFormat(60, 4, "SESSIONS & ATTENDANCE", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 11)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetXY(80, cardY+5)
	pdf.CellFormat(60, 6, fmt.Sprintf("%d Pres | %d Late | %d Missed", data.Summary.TotalPresent, data.Summary.TotalLate, data.Summary.TotalAbsent), "", 0, "L", false, 0, "")

	// Column 3: Overall Attendance Rate
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetXY(160, cardY)
	pdf.CellFormat(55, 4, "OVERALL ATTENDANCE", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 12)
	if data.Summary.OverallAttendancePct >= 75.0 {
		pdf.SetTextColor(16, 185, 129) // emerald
	} else if data.Summary.OverallAttendancePct >= 60.0 {
		pdf.SetTextColor(245, 158, 11) // amber
	} else {
		pdf.SetTextColor(239, 68, 68) // rose
	}
	pdf.SetXY(160, cardY+5)
	pdf.CellFormat(55, 6, fmt.Sprintf("%.1f%% Overall", data.Summary.OverallAttendancePct), "", 0, "L", false, 0, "")

	// Column 4: Standings Breakdown
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetXY(225, cardY)
	pdf.CellFormat(58, 4, "COMPLIANCE STANDINGS", "", 0, "L", false, 0, "")
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetXY(225, cardY+5)
	pdf.CellFormat(58, 6, fmt.Sprintf("Met: %d | Low: %d | Crit: %d", data.Summary.StudentsMeetingRequirement, data.Summary.StudentsBelowRequirement, data.Summary.StudentsCritical), "", 0, "L", false, 0, "")

	pdf.SetY(cardY + 16)
	pdf.Ln(3)

	// --- 3. ATTENDANCE LOG TABLE ---
	// Table Column Widths (Total: 277mm)
	type colDef struct {
		title string
		width float64
		align string
	}
	cols := []colDef{
		{"Student Name", 48, "L"},
		{"Roll No", 20, "C"},
		{"Class", 28, "L"},
		{"Subject", 44, "L"},
		{"Code", 18, "C"},
		{"Date", 22, "C"},
		{"Time", 16, "C"},
		{"Status", 24, "C"},
		{"Marked At", 24, "C"},
		{"Student %", 33, "C"},
	}

	renderTableHeader := func() {
		pdf.SetFillColor(30, 41, 59)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetDrawColor(51, 65, 85)
		pdf.SetFont("Arial", "B", 8)
		for _, c := range cols {
			pdf.CellFormat(c.width, 7, c.title, "1", 0, c.align, true, 0, "")
		}
		pdf.Ln(-1)
	}

	renderTableHeader()

	// Table Body Rows
	pdf.SetFont("Arial", "", 8)
	for i, r := range data.DetailRows {
		if pdf.GetY() > 185 {
			pdf.AddPage()
			renderTableHeader()
			pdf.SetFont("Arial", "", 8)
		}

		// Alternating row background
		if i%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(248, 250, 252)
		}
		pdf.SetDrawColor(226, 232, 240)

		// Student Name
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(cols[0].width, 6, truncateStr(r.StudentName, 26), "1", 0, "L", true, 0, "")

		// Roll No
		pdf.SetTextColor(51, 65, 85)
		pdf.CellFormat(cols[1].width, 6, r.RollNumber, "1", 0, "C", true, 0, "")

		// Class
		pdf.CellFormat(cols[2].width, 6, truncateStr(r.ClassName, 15), "1", 0, "L", true, 0, "")

		// Subject Name
		pdf.CellFormat(cols[3].width, 6, truncateStr(r.SubjectName, 24), "1", 0, "L", true, 0, "")

		// Subject Code
		pdf.CellFormat(cols[4].width, 6, r.SubjectCode, "1", 0, "C", true, 0, "")

		// Date
		pdf.CellFormat(cols[5].width, 6, r.SessionDate, "1", 0, "C", true, 0, "")

		// Time
		pdf.CellFormat(cols[6].width, 6, r.SessionStartTime, "1", 0, "C", true, 0, "")

		// Status (colored badge style)
		if r.AttendanceStatus == "PRESENT" {
			pdf.SetTextColor(16, 185, 129) // emerald
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(cols[7].width, 6, "PRESENT", "1", 0, "C", true, 0, "")
		} else if r.AttendanceStatus == "LATE" {
			pdf.SetTextColor(245, 158, 11) // amber
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(cols[7].width, 6, "LATE", "1", 0, "C", true, 0, "")
		} else {
			pdf.SetTextColor(239, 68, 68) // rose
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(cols[7].width, 6, "ABSENT", "1", 0, "C", true, 0, "")
		}
		pdf.SetFont("Arial", "", 8)

		// Marked At
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(cols[8].width, 6, r.MarkedAt, "1", 0, "C", true, 0, "")

		// Overall Rate
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(cols[9].width, 6, fmt.Sprintf("%.1f%%", r.AttendancePercentage), "1", 1, "C", true, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to render PDF: %w", err)
	}

	return buf.Bytes(), nil
}

// GenerateStudentDetailCSV exports individual student audit logs
func GenerateStudentDetailCSV(w io.Writer, data *models.TeacherStudentAttendanceDetailResponse) error {
	if _, err := w.Write([]byte("\xef\xbb\xbf")); err != nil {
		return err
	}

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write Student Info Header
	_ = writer.Write([]string{"STUDENT ATTENDANCE AUDIT REPORT"})
	_ = writer.Write([]string{"Student Name", sanitizeCSVField(data.Student.Name)})
	_ = writer.Write([]string{"Roll Number", sanitizeCSVField(data.Student.RollNumber)})
	_ = writer.Write([]string{"Email", sanitizeCSVField(data.Student.Email)})
	_ = writer.Write([]string{"Class", sanitizeCSVField(data.Student.ClassName)})
	_ = writer.Write([]string{"Overall Attendance %", fmt.Sprintf("%.1f%%", data.Summary.OverallPercentage)})
	_ = writer.Write([]string{"Late %", fmt.Sprintf("%.1f%%", data.Summary.LatePercentage)})
	_ = writer.Write([]string{"Total Sessions", fmt.Sprintf("%d", data.Summary.TotalSessions)})
	_ = writer.Write([]string{"Present", fmt.Sprintf("%d", data.Summary.TotalPresent)})
	_ = writer.Write([]string{"Late", fmt.Sprintf("%d", data.Summary.TotalLate)})
	_ = writer.Write([]string{"Absent", fmt.Sprintf("%d", data.Summary.TotalAbsent)})
	_ = writer.Write([]string{}) // blank separator

	// Subject Performance Table
	_ = writer.Write([]string{"SUBJECT BREAKDOWN"})
	_ = writer.Write([]string{"Subject Name", "Subject Code", "Present", "Late", "Absent", "Total", "Percentage", "Late %", "Standing"})
	for _, s := range data.Subjects {
		_ = writer.Write([]string{
			sanitizeCSVField(s.SubjectName),
			sanitizeCSVField(s.SubjectCode),
			fmt.Sprintf("%d", s.Present),
			fmt.Sprintf("%d", s.Late),
			fmt.Sprintf("%d", s.Absent),
			fmt.Sprintf("%d", s.Total),
			fmt.Sprintf("%.1f%%", s.Percentage),
			fmt.Sprintf("%.1f%%", s.LatePercentage),
			s.Status,
		})
	}
	_ = writer.Write([]string{}) // blank separator

	// Session History Table
	_ = writer.Write([]string{"ATTENDANCE SESSION LOGS"})
	_ = writer.Write([]string{"Date", "Subject Name", "Subject Code", "Start Time", "End Time", "Status", "Marked At"})
	for _, h := range data.History.Records {
		markedAtStr := "—"
		if h.MarkedAt != nil {
			markedAtStr = h.MarkedAt.Format("15:04:05")
		}
		_ = writer.Write([]string{
			h.StartedAt.Format("2006-01-02"),
			sanitizeCSVField(h.SubjectName),
			sanitizeCSVField(h.SubjectCode),
			h.StartedAt.Format("15:04"),
			h.EndedAt.Format("15:04"),
			h.Status,
			markedAtStr,
		})
	}

	return nil
}

// GenerateStudentDetailExcel exports individual student audit logs in Excel
func GenerateStudentDetailExcel(data *models.TeacherStudentAttendanceDetailResponse) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Student Attendance"
	f.SetSheetName("Sheet1", sheetName)

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14, Color: "0F172A"},
	})
	secHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"1E293B"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
	})
	tblHeaderStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"334155"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	centerStyle, _ := f.NewStyle(&excelize.Style{
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	f.SetCellValue(sheetName, "A1", fmt.Sprintf("Student Attendance Report: %s (%s)", data.Student.Name, data.Student.RollNumber))
	f.SetCellStyle(sheetName, "A1", "A1", titleStyle)

	// Summary Box
	f.SetCellValue(sheetName, "A3", "PROFILE & OVERALL ATTENDANCE SUMMARY")
	f.MergeCell(sheetName, "A3", "F3")
	f.SetCellStyle(sheetName, "A3", "F3", secHeaderStyle)

	f.SetCellValue(sheetName, "A4", "Student Name:")
	f.SetCellValue(sheetName, "B4", data.Student.Name)
	f.SetCellValue(sheetName, "C4", "Roll Number:")
	f.SetCellValue(sheetName, "D4", data.Student.RollNumber)
	f.SetCellValue(sheetName, "E4", "Overall Rate:")
	f.SetCellValue(sheetName, "F4", fmt.Sprintf("%.1f%% (Late: %.1f%%)", data.Summary.OverallPercentage, data.Summary.LatePercentage))

	f.SetCellValue(sheetName, "A5", "Email:")
	f.SetCellValue(sheetName, "B5", data.Student.Email)
	f.SetCellValue(sheetName, "C5", "Class:")
	f.SetCellValue(sheetName, "D5", data.Student.ClassName)
	f.SetCellValue(sheetName, "E5", "Sessions:")
	f.SetCellValue(sheetName, "F5", fmt.Sprintf("%d Pres | %d Late | %d Missed", data.Summary.TotalPresent, data.Summary.TotalLate, data.Summary.TotalAbsent))

	// Subjects Table
	f.SetCellValue(sheetName, "A7", "SUBJECT PERFORMANCE BREAKDOWN")
	f.MergeCell(sheetName, "A7", "G7")
	f.SetCellStyle(sheetName, "A7", "G7", secHeaderStyle)

	subHeaders := []string{"Subject Name", "Code", "Present", "Late", "Absent", "Total", "Percentage"}
	for idx, h := range subHeaders {
		cell, _ := excelize.CoordinatesToCellName(idx+1, 8)
		f.SetCellValue(sheetName, cell, h)
		f.SetCellStyle(sheetName, cell, cell, tblHeaderStyle)
	}

	for idx, sub := range data.Subjects {
		rNum := 9 + idx
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", rNum), sub.SubjectName)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", rNum), sub.SubjectCode)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", rNum), sub.Present)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", rNum), sub.Late)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", rNum), sub.Absent)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", rNum), sub.Total)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", rNum), fmt.Sprintf("%.1f%%", sub.Percentage))
		f.SetCellStyle(sheetName, fmt.Sprintf("B%d", rNum), fmt.Sprintf("G%d", rNum), centerStyle)
	}

	// Session History Table
	histStartRow := 11 + len(data.Subjects)
	f.SetCellValue(sheetName, fmt.Sprintf("A%d", histStartRow), "VERIFIED ATTENDANCE LOGS")
	f.MergeCell(sheetName, fmt.Sprintf("A%d", histStartRow), fmt.Sprintf("F%d", histStartRow))
	f.SetCellStyle(sheetName, fmt.Sprintf("A%d", histStartRow), fmt.Sprintf("F%d", histStartRow), secHeaderStyle)

	histHeaders := []string{"Date", "Subject", "Code", "Timing", "Status", "Marked At"}
	for idx, h := range histHeaders {
		cell, _ := excelize.CoordinatesToCellName(idx+1, histStartRow+1)
		f.SetCellValue(sheetName, cell, h)
		f.SetCellStyle(sheetName, cell, cell, tblHeaderStyle)
	}

	for idx, h := range data.History.Records {
		rNum := histStartRow + 2 + idx
		markedAtStr := "—"
		if h.MarkedAt != nil {
			markedAtStr = h.MarkedAt.Format("15:04:05")
		}
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", rNum), h.StartedAt.Format("2006-01-02"))
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", rNum), h.SubjectName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", rNum), h.SubjectCode)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", rNum), fmt.Sprintf("%s - %s", h.StartedAt.Format("15:04"), h.EndedAt.Format("15:04")))
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", rNum), h.Status)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", rNum), markedAtStr)
		f.SetCellStyle(sheetName, fmt.Sprintf("A%d", rNum), fmt.Sprintf("A%d", rNum), centerStyle)
		f.SetCellStyle(sheetName, fmt.Sprintf("C%d", rNum), fmt.Sprintf("F%d", rNum), centerStyle)
	}

	f.SetColWidth(sheetName, "A", "A", 22)
	f.SetColWidth(sheetName, "B", "B", 26)
	f.SetColWidth(sheetName, "C", "C", 16)
	f.SetColWidth(sheetName, "D", "D", 20)
	f.SetColWidth(sheetName, "E", "E", 16)
	f.SetColWidth(sheetName, "F", "F", 16)
	f.SetColWidth(sheetName, "G", "G", 16)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// GenerateStudentDetailPDF exports individual student audit logs in PDF
func GenerateStudentDetailPDF(data *models.TeacherStudentAttendanceDetailResponse) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetTitle("Student Attendance Report", false)
	pdf.SetAuthor("Student Attendance ERP", false)
	pdf.SetAutoPageBreak(true, 15)
	pdf.SetMargins(12, 12, 12)

	pdf.SetFooterFunc(func() {
		pdf.SetY(-12)
		pdf.SetFont("Arial", "I", 8)
		pdf.SetTextColor(148, 163, 184)
		pdf.CellFormat(93, 8, fmt.Sprintf("Student Attendance Audit • Roll No: %s", data.Student.RollNumber), "", 0, "L", false, 0, "")
		pdf.CellFormat(93, 8, fmt.Sprintf("Page %d of {nb}", pdf.PageNo()), "", 0, "R", false, 0, "")
	})
	pdf.AliasNbPages("{nb}")

	pdf.AddPage()

	// Header
	pdf.SetFont("Arial", "B", 16)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(120, 8, "STUDENT ATTENDANCE REPORT", "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(79, 70, 229)
	pdf.CellFormat(66, 8, "STUDENT AUDIT PROFILE", "", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "", 8.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(186, 5, fmt.Sprintf("Generated: %s UTC", time.Now().UTC().Format("2006-01-02 15:04:05")), "", 1, "L", false, 0, "")
	pdf.Ln(2)

	// Profile & Summary Box
	pdf.SetFillColor(248, 250, 252)
	pdf.SetDrawColor(226, 232, 240)
	pdf.Rect(12, pdf.GetY(), 186, 24, "FD")

	boxY := pdf.GetY() + 2
	pdf.SetXY(16, boxY)
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(90, 5, data.Student.Name, "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 14)
	if data.Summary.OverallPercentage >= 75.0 {
		pdf.SetTextColor(16, 185, 129)
	} else if data.Summary.OverallPercentage >= 60.0 {
		pdf.SetTextColor(245, 158, 11)
	} else {
		pdf.SetTextColor(239, 68, 68)
	}
	pdf.CellFormat(90, 5, fmt.Sprintf("%.1f%% Attendance", data.Summary.OverallPercentage), "", 1, "R", false, 0, "")

	pdf.SetXY(16, boxY+6)
	pdf.SetFont("Arial", "", 8.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(90, 4, fmt.Sprintf("Roll: %s • Email: %s", data.Student.RollNumber, data.Student.Email), "", 0, "L", false, 0, "")

	pdf.SetFont("Arial", "B", 8.5)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(90, 4, fmt.Sprintf("%d Pres | %d Late | %d Missed (%d Total)", data.Summary.TotalPresent, data.Summary.TotalLate, data.Summary.TotalAbsent, data.Summary.TotalSessions), "", 1, "R", false, 0, "")

	pdf.SetXY(16, boxY+11)
	pdf.SetFont("Arial", "", 8.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(180, 4, fmt.Sprintf("Class: %s (%s Sem %d-%s)", data.Student.ClassName, data.Student.Department, data.Student.Semester, data.Student.Section), "", 1, "L", false, 0, "")

	pdf.SetY(boxY + 24)
	pdf.Ln(4)

	// Subject Performance Table
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(186, 6, "SUBJECT PERFORMANCE BREAKDOWN", "", 1, "L", false, 0, "")

	pdf.SetFillColor(30, 41, 59)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 8)
	pdf.CellFormat(50, 6, "Subject Name", "1", 0, "L", true, 0, "")
	pdf.CellFormat(20, 6, "Code", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 6, "Present", "1", 0, "C", true, 0, "")
	pdf.CellFormat(18, 6, "Late", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 6, "Absent", "1", 0, "C", true, 0, "")
	pdf.CellFormat(20, 6, "Total", "1", 0, "C", true, 0, "")
	pdf.CellFormat(38, 6, "Percentage", "1", 1, "C", true, 0, "")

	pdf.SetFont("Arial", "", 8)
	for i, sub := range data.Subjects {
		if i%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(248, 250, 252)
		}
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(50, 5.5, truncateStr(sub.SubjectName, 26), "1", 0, "L", true, 0, "")
		pdf.CellFormat(20, 5.5, sub.SubjectCode, "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 5.5, fmt.Sprintf("%d", sub.Present), "1", 0, "C", true, 0, "")
		pdf.CellFormat(18, 5.5, fmt.Sprintf("%d", sub.Late), "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 5.5, fmt.Sprintf("%d", sub.Absent), "1", 0, "C", true, 0, "")
		pdf.CellFormat(20, 5.5, fmt.Sprintf("%d", sub.Total), "1", 0, "C", true, 0, "")

		if sub.Percentage >= 75.0 {
			pdf.SetTextColor(16, 185, 129)
		} else if sub.Percentage >= 60.0 {
			pdf.SetTextColor(245, 158, 11)
		} else {
			pdf.SetTextColor(239, 68, 68)
		}
		pdf.SetFont("Arial", "B", 8)
		pdf.CellFormat(38, 5.5, fmt.Sprintf("%.1f%% (Late: %.1f%%)", sub.Percentage, sub.LatePercentage), "1", 1, "C", true, 0, "")
		pdf.SetFont("Arial", "", 8)
	}

	pdf.Ln(4)

	// Session History Table
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(186, 6, "ATTENDANCE SESSION LOGS", "", 1, "L", false, 0, "")

	renderHistHeader := func() {
		pdf.SetFillColor(30, 41, 59)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetFont("Arial", "B", 8)
		pdf.CellFormat(26, 6, "Date", "1", 0, "C", true, 0, "")
		pdf.CellFormat(56, 6, "Subject", "1", 0, "L", true, 0, "")
		pdf.CellFormat(22, 6, "Code", "1", 0, "C", true, 0, "")
		pdf.CellFormat(28, 6, "Timing", "1", 0, "C", true, 0, "")
		pdf.CellFormat(26, 6, "Status", "1", 0, "C", true, 0, "")
		pdf.CellFormat(28, 6, "Marked At", "1", 1, "C", true, 0, "")
	}

	renderHistHeader()

	pdf.SetFont("Arial", "", 8)
	for i, h := range data.History.Records {
		if pdf.GetY() > 270 {
			pdf.AddPage()
			renderHistHeader()
			pdf.SetFont("Arial", "", 8)
		}

		if i%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(248, 250, 252)
		}

		markedAtStr := "—"
		if h.MarkedAt != nil {
			markedAtStr = h.MarkedAt.Format("15:04:05")
		}

		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(26, 5.5, h.StartedAt.Format("2006-01-02"), "1", 0, "C", true, 0, "")
		pdf.CellFormat(56, 5.5, truncateStr(h.SubjectName, 28), "1", 0, "L", true, 0, "")
		pdf.CellFormat(22, 5.5, h.SubjectCode, "1", 0, "C", true, 0, "")
		pdf.CellFormat(28, 5.5, fmt.Sprintf("%s - %s", h.StartedAt.Format("15:04"), h.EndedAt.Format("15:04")), "1", 0, "C", true, 0, "")

		if h.Status == "PRESENT" {
			pdf.SetTextColor(16, 185, 129)
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(26, 5.5, "PRESENT", "1", 0, "C", true, 0, "")
		} else if h.Status == "LATE" {
			pdf.SetTextColor(245, 158, 11)
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(26, 5.5, "LATE", "1", 0, "C", true, 0, "")
		} else {
			pdf.SetTextColor(239, 68, 68)
			pdf.SetFont("Arial", "B", 8)
			pdf.CellFormat(26, 5.5, "ABSENT", "1", 0, "C", true, 0, "")
		}
		pdf.SetFont("Arial", "", 8)

		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(28, 5.5, markedAtStr, "1", 1, "C", true, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// truncateStr helper safely limits string length for PDF cell formatting
func truncateStr(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
