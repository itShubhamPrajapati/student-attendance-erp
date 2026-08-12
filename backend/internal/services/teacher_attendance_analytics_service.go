package services

import (
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

var (
	// ErrTeacherNotFound indicates teacher profile was not found for user ID
	ErrTeacherNotFound = errors.New("Teacher profile not found.")
	// ErrUnauthorizedClassAccess indicates teacher is not assigned to teach the specified class
	ErrUnauthorizedClassAccess = errors.New("Access denied to class or class not assigned to you.")
	// ErrUnauthorizedSubjectAccess indicates teacher is not assigned to teach the specified subject
	ErrUnauthorizedSubjectAccess = errors.New("Access denied to subject or subject not assigned to you.")
	// ErrInvalidDateRange indicates malformed or inverted date boundaries
	ErrInvalidDateRange = errors.New("Invalid date range: 'from' date must be before or equal to 'to' date (YYYY-MM-DD).")
)

// normalizeTeacherDateRange validates and parses optional date filters or named period presets
func normalizeTeacherDateRange(fromStr, toStr, periodStr *string) (*time.Time, *time.Time, string, error) {
	now := time.Now().UTC()
	period := "all_time"
	if periodStr != nil && strings.TrimSpace(*periodStr) != "" {
		period = strings.ToLower(strings.TrimSpace(*periodStr))
	}

	var startTime, endTime *time.Time

	switch period {
	case "today":
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		end := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)
		startTime = &start
		endTime = &end
	case "this_week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday -> 7
		}
		monday := now.AddDate(0, 0, -(weekday - 1))
		start := time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, time.UTC)
		sunday := monday.AddDate(0, 0, 6)
		end := time.Date(sunday.Year(), sunday.Month(), sunday.Day(), 23, 59, 59, 999999999, time.UTC)
		startTime = &start
		endTime = &end
	case "this_month":
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		nextMonthFirst := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, time.UTC)
		end := nextMonthFirst.Add(-time.Nanosecond)
		startTime = &start
		endTime = &end
	case "last_7_days":
		sevenDaysAgo := now.AddDate(0, 0, -6)
		start := time.Date(sevenDaysAgo.Year(), sevenDaysAgo.Month(), sevenDaysAgo.Day(), 0, 0, 0, 0, time.UTC)
		end := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)
		startTime = &start
		endTime = &end
	case "last_30_days":
		thirtyDaysAgo := now.AddDate(0, 0, -29)
		start := time.Date(thirtyDaysAgo.Year(), thirtyDaysAgo.Month(), thirtyDaysAgo.Day(), 0, 0, 0, 0, time.UTC)
		end := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)
		startTime = &start
		endTime = &end
	case "current_semester":
		// Standard academic semester window (~6 months)
		halfYearAgo := now.AddDate(0, -6, 0)
		start := time.Date(halfYearAgo.Year(), halfYearAgo.Month(), 1, 0, 0, 0, 0, time.UTC)
		end := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, time.UTC)
		startTime = &start
		endTime = &end
	case "custom":
		// Custom dates required
		if fromStr == nil || strings.TrimSpace(*fromStr) == "" || toStr == nil || strings.TrimSpace(*toStr) == "" {
			return nil, nil, "", ErrInvalidDateRange
		}
	}

	// Handle explicit custom from/to if provided
	if fromStr != nil && strings.TrimSpace(*fromStr) != "" {
		tFrom, err := time.Parse("2006-01-02", strings.TrimSpace(*fromStr))
		if err != nil {
			return nil, nil, "", ErrInvalidDateRange
		}
		start := time.Date(tFrom.Year(), tFrom.Month(), tFrom.Day(), 0, 0, 0, 0, time.UTC)
		startTime = &start
		if period == "all_time" {
			period = "custom"
		}
	}

	if toStr != nil && strings.TrimSpace(*toStr) != "" {
		tTo, err := time.Parse("2006-01-02", strings.TrimSpace(*toStr))
		if err != nil {
			return nil, nil, "", ErrInvalidDateRange
		}
		end := time.Date(tTo.Year(), tTo.Month(), tTo.Day(), 23, 59, 59, 999999999, time.UTC)
		endTime = &end
		if period == "all_time" {
			period = "custom"
		}
	}

	if startTime != nil && endTime != nil && startTime.After(*endTime) {
		return nil, nil, "", ErrInvalidDateRange
	}

	return startTime, endTime, period, nil
}

// GetTeacherAttendanceAnalytics computes comprehensive, authoritative analytics across all authorized classes/subjects
func GetTeacherAttendanceAnalytics(
	db *gorm.DB,
	teacherUserID string,
	req models.TeacherAttendanceAnalyticsRequest,
) (*models.TeacherAttendanceAnalyticsResponse, error) {
	// 1. Resolve teacher record
	var teacher models.Teacher
	if err := db.Where("user_id = ?", teacherUserID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTeacherNotFound
		}
		return nil, err
	}

	// 2. Fetch all teacher teaching assignments (authorized classes and subjects)
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

	// Empty state fallback if teacher has no assigned classes
	if len(assignments) == 0 {
		return &models.TeacherAttendanceAnalyticsResponse{
			Summary:           models.TeacherAttendanceAnalyticsSummary{},
			MonthlyTrend:      []models.TeacherAttendanceMonthlyTrend{},
			WeeklyTrend:       []models.TeacherAttendanceWeeklyTrend{},
			Classes:           []models.TeacherAttendanceClassStat{},
			Subjects:          []models.TeacherAttendanceSubjectStat{},
			Distribution:      models.TeacherAttendanceStandingDistribution{},
			TopStudents:       []models.TeacherAttendanceStudentStat{},
			AttentionStudents: []models.TeacherAttendanceStudentStat{},
			LateAnalysis:      models.TeacherAttendanceLateAnalysis{},
			RecentSessions:    []models.TeacherAttendanceSessionPerformance{},
			Corrections:       models.TeacherAttendanceCorrectionSummary{},
			Filters: models.TeacherAttendanceAnalyticsFilterInfo{
				Period:             "all_time",
				FinalizationStatus: "ALL",
			},
		}, nil
	}

	authorizedClassSet := make(map[string]bool)
	authorizedSubjectSet := make(map[string]bool)
	for _, a := range assignments {
		authorizedClassSet[a.ClassID] = true
		authorizedSubjectSet[a.SubjectID] = true
	}

	// Validate class_id filter if supplied
	var targetClassIDs []string
	var filterClassName *string
	if req.ClassID != nil && strings.TrimSpace(*req.ClassID) != "" {
		cID := strings.TrimSpace(*req.ClassID)
		if !authorizedClassSet[cID] {
			return nil, ErrUnauthorizedClassAccess
		}
		targetClassIDs = []string{cID}
	} else {
		for cID := range authorizedClassSet {
			targetClassIDs = append(targetClassIDs, cID)
		}
	}

	// Validate subject_id filter if supplied
	var targetSubjectIDs []string
	var filterSubjectName *string
	if req.SubjectID != nil && strings.TrimSpace(*req.SubjectID) != "" {
		sID := strings.TrimSpace(*req.SubjectID)
		if !authorizedSubjectSet[sID] {
			return nil, ErrUnauthorizedSubjectAccess
		}
		targetSubjectIDs = []string{sID}
	} else {
		for sID := range authorizedSubjectSet {
			targetSubjectIDs = append(targetSubjectIDs, sID)
		}
	}

	// 3. Normalize Date Range / Presets
	startTime, endTime, periodName, err := normalizeTeacherDateRange(req.From, req.To, req.Period)
	if err != nil {
		return nil, err
	}

	// Normalize Finalization Status
	finalizationFilter := "ALL"
	if req.FinalizationStatus != nil && strings.TrimSpace(*req.FinalizationStatus) != "" {
		cleanFin := strings.ToUpper(strings.TrimSpace(*req.FinalizationStatus))
		if cleanFin == "FINALIZED" || cleanFin == "OPEN" {
			finalizationFilter = cleanFin
		}
	}

	// 4. Fetch metadata for all authorized classes and subjects in scope
	var classesList []models.Class
	if err := db.Where("id IN (?)", targetClassIDs).Find(&classesList).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch classes: %w", err)
	}
	classMap := make(map[string]models.Class)
	for _, c := range classesList {
		classMap[c.ID] = c
		if req.ClassID != nil && c.ID == *req.ClassID {
			name := c.Name
			filterClassName = &name
		}
	}

	var subjectsList []models.Subject
	if err := db.Where("id IN (?)", targetSubjectIDs).Find(&subjectsList).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch subjects: %w", err)
	}
	subjectMap := make(map[string]models.Subject)
	for _, s := range subjectsList {
		subjectMap[s.ID] = s
		if req.SubjectID != nil && s.ID == *req.SubjectID {
			name := s.Name
			filterSubjectName = &name
		}
	}

	// 5. Fetch all enrolled students in target classes
	type studentMeta struct {
		ID         string
		UserID     string
		Name       string
		RollNumber string
		Email      string
		ClassID    string
		Department string
	}
	var enrolledStudents []studentMeta
	if err := db.Table("students").
		Select("id, user_id, name, roll_number, email, class_id, department").
		Where("class_id IN (?)", targetClassIDs).
		Order("roll_number ASC").
		Scan(&enrolledStudents).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch enrolled students: %w", err)
	}

	studentsByClass := make(map[string][]studentMeta)
	studentMap := make(map[string]studentMeta)
	for _, st := range enrolledStudents {
		studentsByClass[st.ClassID] = append(studentsByClass[st.ClassID], st)
		studentMap[st.ID] = st
	}

	// 6. Query Attendance Sessions within target scope
	sessionQuery := db.Table("attendance_sessions ses").
		Select("ses.id, ses.teacher_id, ses.subject_id, ses.class_id, ses.started_at, ses.expires_at, ses.is_active, ses.finalization_status, ses.finalized_at").
		Where("ses.teacher_id = ? AND ses.class_id IN (?) AND ses.subject_id IN (?)", teacher.ID, targetClassIDs, targetSubjectIDs)

	if startTime != nil {
		sessionQuery = sessionQuery.Where("ses.started_at >= ?", *startTime)
	}
	if endTime != nil {
		sessionQuery = sessionQuery.Where("ses.started_at <= ?", *endTime)
	}
	if finalizationFilter == "FINALIZED" {
		sessionQuery = sessionQuery.Where("ses.finalized_at IS NOT NULL OR ses.finalization_status = 'FINALIZED'")
	} else if finalizationFilter == "OPEN" {
		sessionQuery = sessionQuery.Where("ses.finalized_at IS NULL AND (ses.finalization_status IS NULL OR ses.finalization_status = 'OPEN')")
	}

	type sessionRow struct {
		ID                 string
		TeacherID          string
		SubjectID          string
		ClassID            string
		StartedAt          time.Time
		ExpiresAt          time.Time
		IsActive           bool
		FinalizationStatus *string
		FinalizedAt        *time.Time
	}
	var sessions []sessionRow
	if err := sessionQuery.Order("ses.started_at ASC").Scan(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch attendance sessions: %w", err)
	}

	// Collect session IDs
	sessionIDs := make([]string, len(sessions))
	for i, s := range sessions {
		sessionIDs[i] = s.ID
	}

	// 7. Fetch all attendance records across these sessions in a single batch query
	type attendanceRow struct {
		SessionID string
		StudentID string
		Status    string
		MarkedAt  time.Time
	}
	var attendanceRecords []attendanceRow
	if len(sessionIDs) > 0 {
		if err := db.Table("attendance").
			Select("session_id, student_id, status, marked_at").
			Where("session_id IN (?)", sessionIDs).
			Scan(&attendanceRecords).Error; err != nil {
			return nil, fmt.Errorf("failed to fetch attendance records: %w", err)
		}
	}

	// Index attendance records by session_id -> student_id
	attendanceBySession := make(map[string]map[string]attendanceRow)
	for _, a := range attendanceRecords {
		if _, ok := attendanceBySession[a.SessionID]; !ok {
			attendanceBySession[a.SessionID] = make(map[string]attendanceRow)
		}
		attendanceBySession[a.SessionID][a.StudentID] = a
	}

	// 8. Aggregate metrics across all dimensions
	var totalSessions int64 = int64(len(sessions))
	var finalizedSessionsCount int64 = 0
	var openSessionsCount int64 = 0

	// Aggregate collectors
	type studentAgg struct {
		meta          studentMeta
		totalSessions int64
		present       int64
		late          int64
		absent        int64
	}
	studentStatsMap := make(map[string]*studentAgg)
	for _, st := range enrolledStudents {
		studentStatsMap[st.ID] = &studentAgg{
			meta: st,
		}
	}

	type classAgg struct {
		class models.Class
		sessions int64
		present  int64
		late     int64
		absent   int64
	}
	classStatsMap := make(map[string]*classAgg)
	for _, c := range classesList {
		classStatsMap[c.ID] = &classAgg{class: c}
	}

	type subjectAgg struct {
		subject      models.Subject
		classesSet   map[string]bool
		studentsSet  map[string]bool
		sessions     int64
		present      int64
		late         int64
		absent       int64
	}
	subjectStatsMap := make(map[string]*subjectAgg)
	for _, s := range subjectsList {
		subjectStatsMap[s.ID] = &subjectAgg{
			subject:     s,
			classesSet:  make(map[string]bool),
			studentsSet: make(map[string]bool),
		}
	}

	type monthAgg struct {
		monthStr   string
		monthLabel string
		sessions   int64
		present    int64
		late       int64
		absent     int64
	}
	monthStatsMap := make(map[string]*monthAgg)

	type weekAgg struct {
		dayOfWeek int
		dayName   string
		sessions  int64
		present   int64
		late      int64
		absent    int64
	}
	weekStatsMap := make(map[int]*weekAgg)
	dayNames := map[int]string{
		1: "Monday",
		2: "Tuesday",
		3: "Wednesday",
		4: "Thursday",
		5: "Friday",
		6: "Saturday",
		7: "Sunday",
	}
	for d := 1; d <= 7; d++ {
		weekStatsMap[d] = &weekAgg{
			dayOfWeek: d,
			dayName:   dayNames[d],
		}
	}

	var totalPresent int64 = 0
	var totalLate int64 = 0
	var totalAbsent int64 = 0

	recentSessionsList := make([]models.TeacherAttendanceSessionPerformance, 0, len(sessions))

	// Process each session
	for _, s := range sessions {
		isFinalized := s.FinalizedAt != nil || (s.FinalizationStatus != nil && *s.FinalizationStatus == "FINALIZED")
		if isFinalized {
			finalizedSessionsCount++
		} else {
			openSessionsCount++
		}

		classStudents := studentsByClass[s.ClassID]
		totalClassStudents := int64(len(classStudents))

		sessionAttendanceMap := attendanceBySession[s.ID]

		var sessionPresent int64 = 0
		var sessionLate int64 = 0
		var sessionAbsent int64 = 0

		// Update student-level participation
		for _, st := range classStudents {
			stAgg := studentStatsMap[st.ID]
			if stAgg != nil {
				stAgg.totalSessions++
			}

			if att, recorded := sessionAttendanceMap[st.ID]; recorded {
				if strings.ToUpper(att.Status) == "PRESENT" {
					sessionPresent++
					if stAgg != nil {
						stAgg.present++
					}
				} else if strings.ToUpper(att.Status) == "LATE" {
					sessionLate++
					if stAgg != nil {
						stAgg.late++
					}
				} else {
					sessionAbsent++
					if stAgg != nil {
						stAgg.absent++
					}
				}
			} else {
				sessionAbsent++
				if stAgg != nil {
					stAgg.absent++
				}
			}
		}

		sessionAttended := sessionPresent + sessionLate
		sessionPct := 0.0
		if totalClassStudents > 0 {
			sessionPct = math.Round((float64(sessionAttended)/float64(totalClassStudents))*1000) / 10
		}
		sessionLatePct := 0.0
		if totalClassStudents > 0 {
			sessionLatePct = math.Round((float64(sessionLate)/float64(totalClassStudents))*1000) / 10
		}

		totalPresent += sessionPresent
		totalLate += sessionLate
		totalAbsent += sessionAbsent

		// Update class aggregation
		if cAgg, ok := classStatsMap[s.ClassID]; ok {
			cAgg.sessions++
			cAgg.present += sessionPresent
			cAgg.late += sessionLate
			cAgg.absent += sessionAbsent
		}

		// Update subject aggregation
		if sAgg, ok := subjectStatsMap[s.SubjectID]; ok {
			sAgg.sessions++
			sAgg.present += sessionPresent
			sAgg.late += sessionLate
			sAgg.absent += sessionAbsent
			sAgg.classesSet[s.ClassID] = true
			for _, st := range classStudents {
				sAgg.studentsSet[st.ID] = true
			}
		}

		// Update monthly trend
		monthKey := s.StartedAt.Format("2006-01")
		monthLabel := s.StartedAt.Format("Jan 2006")
		mAgg, ok := monthStatsMap[monthKey]
		if !ok {
			mAgg = &monthAgg{
				monthStr:   monthKey,
				monthLabel: monthLabel,
			}
			monthStatsMap[monthKey] = mAgg
		}
		mAgg.sessions++
		mAgg.present += sessionPresent
		mAgg.late += sessionLate
		mAgg.absent += sessionAbsent

		// Update day-of-week trend
		dow := int(s.StartedAt.Weekday())
		if dow == 0 {
			dow = 7 // Sunday -> 7
		}
		wAgg := weekStatsMap[dow]
		wAgg.sessions++
		wAgg.present += sessionPresent
		wAgg.late += sessionLate
		wAgg.absent += sessionAbsent

		// Recent sessions performance item
		finalStatusStr := "OPEN"
		if isFinalized {
			finalStatusStr = "FINALIZED"
		}
		recentSessionsList = append(recentSessionsList, models.TeacherAttendanceSessionPerformance{
			SessionID:            s.ID,
			StartedAt:            s.StartedAt,
			SubjectID:            s.SubjectID,
			SubjectName:          subjectMap[s.SubjectID].Name,
			SubjectCode:          subjectMap[s.SubjectID].Code,
			ClassID:              s.ClassID,
			ClassName:            classMap[s.ClassID].Name,
			TotalStudents:        totalClassStudents,
			Present:              sessionPresent,
			Late:                 sessionLate,
			Absent:               sessionAbsent,
			AttendancePercentage: sessionPct,
			LatePercentage:       sessionLatePct,
			FinalizationStatus:   finalStatusStr,
			FinalizedAt:          s.FinalizedAt,
		})
	}

	// Sort recent sessions in reverse chronological order (latest first)
	sort.Slice(recentSessionsList, func(i, j int) bool {
		return recentSessionsList[i].StartedAt.After(recentSessionsList[j].StartedAt)
	})
	if len(recentSessionsList) > 10 {
		recentSessionsList = recentSessionsList[:10]
	}

	// 9. Calculate Overall Rates
	totalAttended := totalPresent + totalLate
	totalInstances := totalAttended + totalAbsent
	overallAttendancePct := 0.0
	if totalInstances > 0 {
		overallAttendancePct = math.Round((float64(totalAttended)/float64(totalInstances))*1000) / 10
	}
	overallLatePct := 0.0
	if totalInstances > 0 {
		overallLatePct = math.Round((float64(totalLate)/float64(totalInstances))*1000) / 10
	}

	// 10. Student Standings Distribution, Top Students & Attention Students
	var reqMetCount int64 = 0
	var belowReqCount int64 = 0
	var criticalCount int64 = 0

	allStudentStats := make([]models.TeacherAttendanceStudentStat, 0, len(studentStatsMap))

	var mostLateStudent *models.TeacherAttendanceStudentStat
	var maxLateCount int64 = -1

	for _, sAgg := range studentStatsMap {
		stAttended := sAgg.present + sAgg.late
		stPct := 0.0
		if sAgg.totalSessions > 0 {
			stPct = math.Round((float64(stAttended)/float64(sAgg.totalSessions))*1000) / 10
		}
		stLatePct := 0.0
		if sAgg.totalSessions > 0 {
			stLatePct = math.Round((float64(sAgg.late)/float64(sAgg.totalSessions))*1000) / 10
		}

		status := "REQUIREMENT_MET"
		if sAgg.totalSessions > 0 {
			if stPct < 60.0 {
				status = "CRITICAL"
				criticalCount++
			} else if stPct < 75.0 {
				status = "BELOW_REQUIREMENT"
				belowReqCount++
			} else {
				reqMetCount++
			}
		} else {
			reqMetCount++
		}

		stat := models.TeacherAttendanceStudentStat{
			StudentID:            sAgg.meta.ID,
			UserID:               sAgg.meta.UserID,
			Name:                 sAgg.meta.Name,
			RollNumber:           sAgg.meta.RollNumber,
			Email:                sAgg.meta.Email,
			ClassID:              sAgg.meta.ClassID,
			ClassName:            classMap[sAgg.meta.ClassID].Name,
			Department:           sAgg.meta.Department,
			TotalSessions:        sAgg.totalSessions,
			Present:              sAgg.present,
			Late:                 sAgg.late,
			Absent:               sAgg.absent,
			AttendancePercentage: stPct,
			LatePercentage:       stLatePct,
			Status:               status,
		}
		allStudentStats = append(allStudentStats, stat)

		if sAgg.late > maxLateCount && sAgg.late > 0 {
			maxLateCount = sAgg.late
			copyStat := stat
			mostLateStudent = &copyStat
		}
	}

	// Sort top students (highest percentage desc, roll number asc)
	sort.Slice(allStudentStats, func(i, j int) bool {
		if allStudentStats[i].AttendancePercentage != allStudentStats[j].AttendancePercentage {
			return allStudentStats[i].AttendancePercentage > allStudentStats[j].AttendancePercentage
		}
		return allStudentStats[i].RollNumber < allStudentStats[j].RollNumber
	})

	topStudents := make([]models.TeacherAttendanceStudentStat, 0)
	for _, st := range allStudentStats {
		if st.TotalSessions > 0 {
			topStudents = append(topStudents, st)
			if len(topStudents) >= 5 {
				break
			}
		}
	}

	// Filter attention students (Critical < 60% first, then Below Requirement 60-74.9%)
	var attentionStudents []models.TeacherAttendanceStudentStat
	var criticalList []models.TeacherAttendanceStudentStat
	var belowList []models.TeacherAttendanceStudentStat

	for _, st := range allStudentStats {
		if st.TotalSessions > 0 {
			if st.Status == "CRITICAL" {
				criticalList = append(criticalList, st)
			} else if st.Status == "BELOW_REQUIREMENT" {
				belowList = append(belowList, st)
			}
		}
	}

	sort.Slice(criticalList, func(i, j int) bool {
		return criticalList[i].AttendancePercentage < criticalList[j].AttendancePercentage
	})
	sort.Slice(belowList, func(i, j int) bool {
		return belowList[i].AttendancePercentage < belowList[j].AttendancePercentage
	})

	attentionStudents = append(attentionStudents, criticalList...)
	attentionStudents = append(attentionStudents, belowList...)
	if len(attentionStudents) > 15 {
		attentionStudents = attentionStudents[:15]
	}

	// 11. Class-Wise Statistics & Highest Late Class
	classStatsResult := make([]models.TeacherAttendanceClassStat, 0, len(classesList))
	var highestLateClass *models.TeacherAttendanceClassStat
	var maxClassLatePct float64 = -1.0

	for _, c := range classesList {
		cAgg := classStatsMap[c.ID]
		cAttended := cAgg.present + cAgg.late
		cTotalInst := cAttended + cAgg.absent
		cPct := 0.0
		if cTotalInst > 0 {
			cPct = math.Round((float64(cAttended)/float64(cTotalInst))*1000) / 10
		}
		cLatePct := 0.0
		if cTotalInst > 0 {
			cLatePct = math.Round((float64(cAgg.late)/float64(cTotalInst))*1000) / 10
		}

		// Count below requirement and critical students in this class
		var cBelow int64 = 0
		var cCrit int64 = 0
		for _, st := range studentsByClass[c.ID] {
			stStat := studentStatsMap[st.ID]
			if stStat != nil && stStat.totalSessions > 0 {
				stPct := (float64(stStat.present+stStat.late) / float64(stStat.totalSessions)) * 100
				if stPct < 60.0 {
					cCrit++
				} else if stPct < 75.0 {
					cBelow++
				}
			}
		}

		cStat := models.TeacherAttendanceClassStat{
			ClassID:                  c.ID,
			ClassName:                c.Name,
			Department:               c.Department,
			Semester:                 c.Semester,
			Section:                  c.Section,
			TotalStudents:            int64(len(studentsByClass[c.ID])),
			TotalSessions:            cAgg.sessions,
			Present:                  cAgg.present,
			Late:                     cAgg.late,
			Absent:                   cAgg.absent,
			AttendancePercentage:     cPct,
			LatePercentage:           cLatePct,
			BelowRequirementStudents: cBelow,
			CriticalStudents:         cCrit,
		}
		classStatsResult = append(classStatsResult, cStat)

		if cAgg.sessions > 0 && cLatePct > maxClassLatePct {
			maxClassLatePct = cLatePct
			copyCStat := cStat
			highestLateClass = &copyCStat
		}
	}

	// 12. Subject-Wise Statistics & Highest Late Subject
	subjectStatsResult := make([]models.TeacherAttendanceSubjectStat, 0, len(subjectsList))
	var highestLateSubject *models.TeacherAttendanceSubjectStat
	var maxSubjectLatePct float64 = -1.0

	for _, s := range subjectsList {
		sAgg := subjectStatsMap[s.ID]
		sAttended := sAgg.present + sAgg.late
		sTotalInst := sAttended + sAgg.absent
		sPct := 0.0
		if sTotalInst > 0 {
			sPct = math.Round((float64(sAttended)/float64(sTotalInst))*1000) / 10
		}
		sLatePct := 0.0
		if sTotalInst > 0 {
			sLatePct = math.Round((float64(sAgg.late)/float64(sTotalInst))*1000) / 10
		}

		// Count below and critical students in subject
		var sBelow int64 = 0
		var sCrit int64 = 0
		for stID := range sAgg.studentsSet {
			stStat := studentStatsMap[stID]
			if stStat != nil && stStat.totalSessions > 0 {
				stPct := (float64(stStat.present+stStat.late) / float64(stStat.totalSessions)) * 100
				if stPct < 60.0 {
					sCrit++
				} else if stPct < 75.0 {
					sBelow++
				}
			}
		}

		sStat := models.TeacherAttendanceSubjectStat{
			SubjectID:                s.ID,
			SubjectName:              s.Name,
			SubjectCode:              s.Code,
			ClassesCount:             int64(len(sAgg.classesSet)),
			TotalSessions:            sAgg.sessions,
			TotalStudents:            int64(len(sAgg.studentsSet)),
			Present:                  sAgg.present,
			Late:                     sAgg.late,
			Absent:                   sAgg.absent,
			AttendancePercentage:     sPct,
			LatePercentage:           sLatePct,
			BelowRequirementStudents: sBelow,
			CriticalStudents:         sCrit,
		}
		subjectStatsResult = append(subjectStatsResult, sStat)

		if sAgg.sessions > 0 && sLatePct > maxSubjectLatePct {
			maxSubjectLatePct = sLatePct
			copySStat := sStat
			highestLateSubject = &copySStat
		}
	}

	// 13. Monthly Trend List (Chronological Order)
	var monthKeys []string
	for k := range monthStatsMap {
		monthKeys = append(monthKeys, k)
	}
	sort.Strings(monthKeys)

	monthlyTrendList := make([]models.TeacherAttendanceMonthlyTrend, 0, len(monthKeys))
	for _, k := range monthKeys {
		mAgg := monthStatsMap[k]
		mAttended := mAgg.present + mAgg.late
		mTotal := mAttended + mAgg.absent
		mPct := 0.0
		if mTotal > 0 {
			mPct = math.Round((float64(mAttended)/float64(mTotal))*1000) / 10
		}
		mLatePct := 0.0
		if mTotal > 0 {
			mLatePct = math.Round((float64(mAgg.late)/float64(mTotal))*1000) / 10
		}
		monthlyTrendList = append(monthlyTrendList, models.TeacherAttendanceMonthlyTrend{
			Month:                mAgg.monthStr,
			MonthLabel:           mAgg.monthLabel,
			TotalSessions:        mAgg.sessions,
			Present:              mAgg.present,
			Late:                 mAgg.late,
			Absent:               mAgg.absent,
			AttendancePercentage: mPct,
			LatePercentage:       mLatePct,
		})
	}

	// 14. Weekly Trend List (Monday through Saturday/Sunday)
	weeklyTrendList := make([]models.TeacherAttendanceWeeklyTrend, 0, 7)
	for d := 1; d <= 7; d++ {
		wAgg := weekStatsMap[d]
		wAttended := wAgg.present + wAgg.late
		wTotal := wAttended + wAgg.absent
		wPct := 0.0
		if wTotal > 0 {
			wPct = math.Round((float64(wAttended)/float64(wTotal))*1000) / 10
		}
		wLatePct := 0.0
		if wTotal > 0 {
			wLatePct = math.Round((float64(wAgg.late)/float64(wTotal))*1000) / 10
		}
		weeklyTrendList = append(weeklyTrendList, models.TeacherAttendanceWeeklyTrend{
			DayOfWeek:            d,
			DayName:              wAgg.dayName,
			TotalSessions:        wAgg.sessions,
			Present:              wAgg.present,
			Late:                 wAgg.late,
			Absent:               wAgg.absent,
			AttendancePercentage: wPct,
			LatePercentage:       wLatePct,
		})
	}

	// 15. Audit / Correction Summary
	var auditSummary models.TeacherAttendanceCorrectionSummary
	if len(sessionIDs) > 0 {
		type auditRow struct {
			Action         string
			PreviousStatus *string
			NewStatus      string
		}
		var audits []auditRow
		db.Table("attendance_audit").
			Select("action, previous_status, new_status").
			Where("session_id IN (?)", sessionIDs).
			Scan(&audits)

		for _, a := range audits {
			if a.Action == "MANUAL_MARK" {
				auditSummary.TotalManualMarks++
			} else if a.Action == "CORRECTION" {
				auditSummary.TotalCorrections++
				prev := ""
				if a.PreviousStatus != nil {
					prev = strings.ToUpper(*a.PreviousStatus)
				}
				next := strings.ToUpper(a.NewStatus)

				if prev == "PRESENT" && next == "LATE" {
					auditSummary.PresentToLate++
				} else if prev == "LATE" && next == "PRESENT" {
					auditSummary.LateToPresent++
				} else if prev == "ABSENT" && next == "PRESENT" {
					auditSummary.AbsentToPresent++
				} else if prev == "ABSENT" && next == "LATE" {
					auditSummary.AbsentToLate++
				} else {
					auditSummary.OtherCorrections++
				}
			}
		}
	}

	// 16. Assemble Complete Response
	response := &models.TeacherAttendanceAnalyticsResponse{
		Summary: models.TeacherAttendanceAnalyticsSummary{
			TotalClasses:             int64(len(classesList)),
			TotalSubjects:            int64(len(subjectsList)),
			TotalStudents:            int64(len(enrolledStudents)),
			TotalSessions:            totalSessions,
			TotalPresent:             totalPresent,
			TotalLate:                totalLate,
			TotalAbsent:              totalAbsent,
			TotalAttended:            totalAttended,
			AttendancePercentage:     overallAttendancePct,
			LatePercentage:           overallLatePct,
			BelowRequirementStudents: belowReqCount,
			CriticalStudents:         criticalCount,
			OpenSessions:             openSessionsCount,
			FinalizedSessions:        finalizedSessionsCount,
		},
		MonthlyTrend: monthlyTrendList,
		WeeklyTrend:  weeklyTrendList,
		Classes:      classStatsResult,
		Subjects:     subjectStatsResult,
		Distribution: models.TeacherAttendanceStandingDistribution{
			RequirementMet:   reqMetCount,
			BelowRequirement: belowReqCount,
			Critical:         criticalCount,
			TotalEvaluated:   int64(len(enrolledStudents)),
		},
		TopStudents:       topStudents,
		AttentionStudents: attentionStudents,
		LateAnalysis: models.TeacherAttendanceLateAnalysis{
			TotalLate:          totalLate,
			LatePercentage:     overallLatePct,
			MostLateStudent:    mostLateStudent,
			HighestLateClass:   highestLateClass,
			HighestLateSubject: highestLateSubject,
		},
		RecentSessions: recentSessionsList,
		Corrections:    auditSummary,
		Filters: models.TeacherAttendanceAnalyticsFilterInfo{
			ClassID:            req.ClassID,
			ClassName:          filterClassName,
			SubjectID:          req.SubjectID,
			SubjectName:        filterSubjectName,
			From:               req.From,
			To:                 req.To,
			Period:             periodName,
			FinalizationStatus: finalizationFilter,
		},
	}

	return response, nil
}
