package services

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"qr-attendance-backend/internal/models"

	"gorm.io/gorm"
)

var (
	// ErrInvalidActivityLimit indicates requested limit is out of acceptable bounds
	ErrInvalidActivityLimit = errors.New("Invalid limit: must be an integer between 1 and 50.")
)

// GetRecentActivity aggregates and normalizes authoritative activity events across existing tables
func GetRecentActivity(
	db *gorm.DB,
	userID string,
	role string,
	req models.RecentActivityRequest,
) (*models.RecentActivityResponse, error) {
	// 1. Sanitize pagination parameters
	limit := 10
	if req.Limit != nil {
		if *req.Limit < 1 || *req.Limit > 50 {
			return nil, ErrInvalidActivityLimit
		}
		limit = *req.Limit
	}

	page := 1
	if req.Page != nil && *req.Page > 0 {
		page = *req.Page
	}

	// 2. Parse Date Filters if provided
	var startTime, endTime *time.Time
	if req.From != nil && strings.TrimSpace(*req.From) != "" {
		tFrom, err := time.Parse("2006-01-02", strings.TrimSpace(*req.From))
		if err != nil {
			return nil, ErrInvalidDateRange
		}
		start := time.Date(tFrom.Year(), tFrom.Month(), tFrom.Day(), 0, 0, 0, 0, time.UTC)
		startTime = &start
	}
	if req.To != nil && strings.TrimSpace(*req.To) != "" {
		tTo, err := time.Parse("2006-01-02", strings.TrimSpace(*req.To))
		if err != nil {
			return nil, ErrInvalidDateRange
		}
		end := time.Date(tTo.Year(), tTo.Month(), tTo.Day(), 23, 59, 59, 999999999, time.UTC)
		endTime = &end
	}
	if startTime != nil && endTime != nil && startTime.After(*endTime) {
		return nil, ErrInvalidDateRange
	}

	var rawActivities []models.ActivityItem

	// 3. Aggregate based on authenticated role
	switch strings.ToUpper(role) {
	case models.RoleStudent:
		acts, err := getStudentRecentActivity(db, userID, startTime, endTime)
		if err != nil {
			return nil, err
		}
		rawActivities = acts

	case models.RoleTeacher:
		acts, err := getTeacherRecentActivity(db, userID, startTime, endTime)
		if err != nil {
			return nil, err
		}
		rawActivities = acts

	case models.RoleAdmin:
		acts, err := getAdminRecentActivity(db, userID, startTime, endTime)
		if err != nil {
			return nil, err
		}
		rawActivities = acts

	default:
		return &models.RecentActivityResponse{
			Activities: []models.ActivityItem{},
			Total:      0,
			Limit:      limit,
			Page:       page,
		}, nil
	}

	// 4. Filter by Activity Type if requested
	var filtered []models.ActivityItem
	if req.Type != nil && strings.TrimSpace(*req.Type) != "" {
		targetType := models.ActivityType(strings.ToUpper(strings.TrimSpace(*req.Type)))
		for _, item := range rawActivities {
			if item.Type == targetType {
				filtered = append(filtered, item)
			}
		}
	} else {
		filtered = rawActivities
	}

	// 5. Sort by CreatedAt DESC
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	// 6. Paginate results
	total := int64(len(filtered))
	offset := (page - 1) * limit
	if offset > len(filtered) {
		offset = len(filtered)
	}
	endIdx := offset + limit
	if endIdx > len(filtered) {
		endIdx = len(filtered)
	}

	paginated := filtered[offset:endIdx]

	return &models.RecentActivityResponse{
		Activities: paginated,
		Total:      total,
		Limit:      limit,
		Page:       page,
	}, nil
}

// ------------------------------------------------------------------------------
// STUDENT ACTIVITY AGGREGATION
// ------------------------------------------------------------------------------
func getStudentRecentActivity(
	db *gorm.DB,
	userID string,
	startTime, endTime *time.Time,
) ([]models.ActivityItem, error) {
	var student models.Student
	if err := db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.ActivityItem{}, nil
		}
		return nil, err
	}

	var items []models.ActivityItem

	// 1. Student's Attendance Records
	type studentAttRow struct {
		ID          string
		SessionID   string
		Status      string
		MarkedAt    time.Time
		CreatedAt   time.Time
		SubjectName string
		SubjectCode string
		ClassName   string
	}
	var attRows []studentAttRow
	attQuery := db.Table("attendance a").
		Select("a.id, a.session_id, a.status, a.marked_at, a.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Where("a.student_id = ?", student.ID)

	if startTime != nil {
		attQuery = attQuery.Where("a.marked_at >= ?", *startTime)
	}
	if endTime != nil {
		attQuery = attQuery.Where("a.marked_at <= ?", *endTime)
	}
	if err := attQuery.Order("a.marked_at DESC").Limit(50).Scan(&attRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch student attendance for feed: %w", err)
	}

	for _, r := range attRows {
		statusUpper := strings.ToUpper(r.Status)
		itemType := models.ActivityTypeAttendanceMarked
		severity := models.ActivitySeveritySuccess
		title := "Attendance Marked"
		desc := fmt.Sprintf("Attendance marked PRESENT for %s.", r.SubjectName)

		if statusUpper == "LATE" {
			itemType = models.ActivityTypeAttendanceLate
			severity = models.ActivitySeverityWarning
			title = "Late Attendance Recorded"
			desc = fmt.Sprintf("Attendance recorded LATE for %s.", r.SubjectName)
		} else if statusUpper == "ABSENT" {
			continue // Don't spam standard unrecorded absent rows as individual feed events
		}

		subName := r.SubjectName
		subCode := r.SubjectCode
		clsName := r.ClassName
		sesID := r.SessionID
		attID := r.ID

		items = append(items, models.ActivityItem{
			ID:           fmt.Sprintf("att-%s", r.ID),
			Type:         itemType,
			Severity:     severity,
			Title:        title,
			Description:  desc,
			SubjectName:  &subName,
			SubjectCode:  &subCode,
			ClassName:    &clsName,
			SessionID:    &sesID,
			AttendanceID: &attID,
			CreatedAt:    r.MarkedAt,
		})
	}

	// 2. Student's Attendance Audit History (Manual Marks & Corrections)
	type studentAuditRow struct {
		ID             string
		AttendanceID   *string
		SessionID      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         string
		CreatedAt      time.Time
		SubjectName    string
		SubjectCode    string
		ClassName      string
		ActorRole      string
	}
	var auditRows []studentAuditRow
	auditQuery := db.Table("attendance_audit au").
		Select("au.id, au.attendance_id, au.session_id, au.action, au.previous_status, au.new_status, au.reason, au.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, au.actor_role").
		Joins("JOIN attendance_sessions ses ON ses.id = au.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Where("au.student_id = ?", student.ID)

	if startTime != nil {
		auditQuery = auditQuery.Where("au.created_at >= ?", *startTime)
	}
	if endTime != nil {
		auditQuery = auditQuery.Where("au.created_at <= ?", *endTime)
	}
	if err := auditQuery.Order("au.created_at DESC").Limit(50).Scan(&auditRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch student attendance audits: %w", err)
	}

	for _, a := range auditRows {
		itemType := models.ActivityTypeAttendanceCorrected
		severity := models.ActivitySeverityImportant
		title := "Attendance Corrected"
		prev := "ABSENT"
		if a.PreviousStatus != nil && *a.PreviousStatus != "" {
			prev = *a.PreviousStatus
		}
		desc := fmt.Sprintf("Your attendance was corrected from %s to %s for %s.", prev, a.NewStatus, a.SubjectName)

		if a.Action == "MANUAL_MARK" {
			itemType = models.ActivityTypeManualAttendance
			title = "Manual Attendance Mark"
			desc = fmt.Sprintf("Your attendance was recorded manually as %s for %s.", a.NewStatus, a.SubjectName)
		}

		subName := a.SubjectName
		subCode := a.SubjectCode
		clsName := a.ClassName
		sesID := a.SessionID
		actRole := a.ActorRole

		items = append(items, models.ActivityItem{
			ID:           fmt.Sprintf("aud-%s", a.ID),
			Type:         itemType,
			Severity:     severity,
			Title:        title,
			Description:  desc,
			ActorRole:    &actRole,
			SubjectName:  &subName,
			SubjectCode:  &subCode,
			ClassName:    &clsName,
			SessionID:    &sesID,
			AttendanceID: a.AttendanceID,
			CreatedAt:    a.CreatedAt,
		})
	}

	// 3. Student's Digital Attendance Proofs
	type studentProofRow struct {
		ID           string
		PublicID     string
		AttendanceID string
		CreatedAt    time.Time
		SubjectName  string
		SubjectCode  string
		ClassName    string
		SessionID    string
	}
	var proofRows []studentProofRow
	proofQuery := db.Table("attendance_proofs pr").
		Select("pr.id, pr.public_id, pr.attendance_id, pr.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, ses.id as session_id").
		Joins("JOIN attendance a ON a.id = pr.attendance_id").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Where("a.student_id = ?", student.ID)

	if startTime != nil {
		proofQuery = proofQuery.Where("pr.created_at >= ?", *startTime)
	}
	if endTime != nil {
		proofQuery = proofQuery.Where("pr.created_at <= ?", *endTime)
	}
	if err := proofQuery.Order("pr.created_at DESC").Limit(30).Scan(&proofRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch student proofs: %w", err)
	}

	for _, p := range proofRows {
		subName := p.SubjectName
		subCode := p.SubjectCode
		clsName := p.ClassName
		sesID := p.SessionID
		attID := p.AttendanceID
		pubID := p.PublicID

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("prf-%s", p.ID),
			Type:          models.ActivityTypeProofGenerated,
			Severity:      models.ActivitySeveritySuccess,
			Title:         "Attendance Proof Generated",
			Description:   fmt.Sprintf("Digital attendance receipt verified and available for %s.", p.SubjectName),
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  &attID,
			ProofPublicID: &pubID,
			CreatedAt:     p.CreatedAt,
		})
	}

	return items, nil
}

// ------------------------------------------------------------------------------
// TEACHER ACTIVITY AGGREGATION
// ------------------------------------------------------------------------------
func getTeacherRecentActivity(
	db *gorm.DB,
	userID string,
	startTime, endTime *time.Time,
) ([]models.ActivityItem, error) {
	var teacher models.Teacher
	if err := db.Where("user_id = ?", userID).First(&teacher).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.ActivityItem{}, nil
		}
		return nil, err
	}

	var items []models.ActivityItem

	// 1. Session Lifecycle Audit Events for Teacher's Sessions
	type teacherSessionAuditRow struct {
		ID             string
		SessionID      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         *string
		CreatedAt      time.Time
		SubjectName    string
		SubjectCode    string
		ClassName      string
		ActorRole      string
		ActorName      *string
	}
	var sesAuditRows []teacherSessionAuditRow
	sesAuditQuery := db.Table("attendance_session_audit sa").
		Select("sa.id, sa.session_id, sa.action, sa.previous_status, sa.new_status, sa.reason, sa.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, sa.actor_role, u.name as actor_name").
		Joins("JOIN attendance_sessions ses ON ses.id = sa.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("LEFT JOIN users u ON u.id = sa.actor_user_id").
		Where("ses.teacher_id = ?", teacher.ID)

	if startTime != nil {
		sesAuditQuery = sesAuditQuery.Where("sa.created_at >= ?", *startTime)
	}
	if endTime != nil {
		sesAuditQuery = sesAuditQuery.Where("sa.created_at <= ?", *endTime)
	}
	if err := sesAuditQuery.Order("sa.created_at DESC").Limit(50).Scan(&sesAuditRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher session audit: %w", err)
	}

	for _, sa := range sesAuditRows {
		itemType := models.ActivityTypeSessionFinalized
		severity := models.ActivitySeverityInfo
		title := "Session Finalized"
		desc := fmt.Sprintf("Attendance session for %s (%s) was finalized and locked.", sa.SubjectName, sa.ClassName)

		if sa.Action == "REOPEN" {
			itemType = models.ActivityTypeSessionReopened
			severity = models.ActivitySeverityWarning
			title = "Session Reopened"
			desc = fmt.Sprintf("Attendance session for %s (%s) was reopened.", sa.SubjectName, sa.ClassName)
		}

		subName := sa.SubjectName
		subCode := sa.SubjectCode
		clsName := sa.ClassName
		sesID := sa.SessionID
		actRole := sa.ActorRole

		items = append(items, models.ActivityItem{
			ID:          fmt.Sprintf("sesaud-%s", sa.ID),
			Type:        itemType,
			Severity:    severity,
			Title:       title,
			Description: desc,
			ActorName:   sa.ActorName,
			ActorRole:   &actRole,
			SubjectName: &subName,
			SubjectCode: &subCode,
			ClassName:   &clsName,
			SessionID:   &sesID,
			CreatedAt:   sa.CreatedAt,
		})
	}

	// 2. Attendance Sessions Started by Teacher
	type teacherSessionRow struct {
		ID          string
		StartedAt   time.Time
		SubjectName string
		SubjectCode string
		ClassName   string
	}
	var sessionRows []teacherSessionRow
	sesQuery := db.Table("attendance_sessions ses").
		Select("ses.id, ses.started_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Where("ses.teacher_id = ?", teacher.ID)

	if startTime != nil {
		sesQuery = sesQuery.Where("ses.started_at >= ?", *startTime)
	}
	if endTime != nil {
		sesQuery = sesQuery.Where("ses.started_at <= ?", *endTime)
	}
	if err := sesQuery.Order("ses.started_at DESC").Limit(40).Scan(&sessionRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher sessions: %w", err)
	}

	for _, s := range sessionRows {
		subName := s.SubjectName
		subCode := s.SubjectCode
		clsName := s.ClassName
		sesID := s.ID

		items = append(items, models.ActivityItem{
			ID:          fmt.Sprintf("ses-%s", s.ID),
			Type:        models.ActivityTypeSessionStarted,
			Severity:    models.ActivitySeverityInfo,
			Title:       "Session Started",
			Description: fmt.Sprintf("Attendance session started for %s (%s).", s.SubjectName, s.ClassName),
			SubjectName: &subName,
			SubjectCode: &subCode,
			ClassName:   &clsName,
			SessionID:   &sesID,
			CreatedAt:   s.StartedAt,
		})
	}

	// 3. Attendance Audit Records (Manual marks / corrections on teacher's sessions)
	type teacherAuditRow struct {
		ID             string
		AttendanceID   *string
		SessionID      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         string
		CreatedAt      time.Time
		SubjectName    string
		SubjectCode    string
		ClassName      string
		StudentName    string
		StudentRollNo  string
		ActorRole      string
		ActorName      *string
	}
	var auditRows []teacherAuditRow
	auditQuery := db.Table("attendance_audit au").
		Select("au.id, au.attendance_id, au.session_id, au.action, au.previous_status, au.new_status, au.reason, au.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no, au.actor_role, u.name as actor_name").
		Joins("JOIN attendance_sessions ses ON ses.id = au.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = au.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id").
		Joins("LEFT JOIN users u ON u.id = au.actor_user_id").
		Where("ses.teacher_id = ?", teacher.ID)

	if startTime != nil {
		auditQuery = auditQuery.Where("au.created_at >= ?", *startTime)
	}
	if endTime != nil {
		auditQuery = auditQuery.Where("au.created_at <= ?", *endTime)
	}
	if err := auditQuery.Order("au.created_at DESC").Limit(50).Scan(&auditRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher attendance audit: %w", err)
	}

	for _, a := range auditRows {
		itemType := models.ActivityTypeAttendanceCorrected
		severity := models.ActivitySeverityImportant
		title := "Attendance Corrected"
		prev := "ABSENT"
		if a.PreviousStatus != nil && *a.PreviousStatus != "" {
			prev = *a.PreviousStatus
		}
		desc := fmt.Sprintf("Attendance for %s was corrected from %s to %s in %s.", a.StudentName, prev, a.NewStatus, a.SubjectName)

		if a.Action == "MANUAL_MARK" {
			itemType = models.ActivityTypeManualAttendance
			title = "Manual Attendance Mark"
			desc = fmt.Sprintf("%s was manually marked %s in %s.", a.StudentName, a.NewStatus, a.SubjectName)
		}

		subName := a.SubjectName
		subCode := a.SubjectCode
		clsName := a.ClassName
		stName := a.StudentName
		stRoll := a.StudentRollNo
		sesID := a.SessionID
		actRole := a.ActorRole

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("aud-%s", a.ID),
			Type:          itemType,
			Severity:      severity,
			Title:         title,
			Description:   desc,
			ActorName:     a.ActorName,
			ActorRole:     &actRole,
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  a.AttendanceID,
			CreatedAt:     a.CreatedAt,
		})
	}

	// 4. Late Check-ins & Recent Notable Attendance for Teacher's Sessions
	type teacherAttRow struct {
		ID            string
		SessionID     string
		Status        string
		MarkedAt      time.Time
		SubjectName   string
		SubjectCode   string
		ClassName     string
		StudentName   string
		StudentRollNo string
	}
	var attRows []teacherAttRow
	attQuery := db.Table("attendance a").
		Select("a.id, a.session_id, a.status, a.marked_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = a.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id").
		Where("ses.teacher_id = ? AND a.status = 'LATE'", teacher.ID)

	if startTime != nil {
		attQuery = attQuery.Where("a.marked_at >= ?", *startTime)
	}
	if endTime != nil {
		attQuery = attQuery.Where("a.marked_at <= ?", *endTime)
	}
	if err := attQuery.Order("a.marked_at DESC").Limit(50).Scan(&attRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher late attendance: %w", err)
	}

	for _, r := range attRows {
		subName := r.SubjectName
		subCode := r.SubjectCode
		clsName := r.ClassName
		stName := r.StudentName
		stRoll := r.StudentRollNo
		sesID := r.SessionID
		attID := r.ID

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("att-%s", r.ID),
			Type:          models.ActivityTypeAttendanceLate,
			Severity:      models.ActivitySeverityWarning,
			Title:         "Late Check-in",
			Description:   fmt.Sprintf("%s was marked LATE in %s (%s).", r.StudentName, r.SubjectName, r.ClassName),
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  &attID,
			CreatedAt:     r.MarkedAt,
		})
	}

	// 5. Digital Proofs for Teacher's Sessions
	type teacherProofRow struct {
		ID            string
		PublicID      string
		AttendanceID  string
		CreatedAt     time.Time
		SubjectName   string
		SubjectCode   string
		ClassName     string
		StudentName   string
		StudentRollNo string
		SessionID     string
	}
	var proofRows []teacherProofRow
	proofQuery := db.Table("attendance_proofs pr").
		Select("pr.id, pr.public_id, pr.attendance_id, pr.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no, ses.id as session_id").
		Joins("JOIN attendance a ON a.id = pr.attendance_id").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = a.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id").
		Where("ses.teacher_id = ?", teacher.ID)

	if startTime != nil {
		proofQuery = proofQuery.Where("pr.created_at >= ?", *startTime)
	}
	if endTime != nil {
		proofQuery = proofQuery.Where("pr.created_at <= ?", *endTime)
	}
	if err := proofQuery.Order("pr.created_at DESC").Limit(30).Scan(&proofRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch teacher proofs: %w", err)
	}

	for _, p := range proofRows {
		subName := p.SubjectName
		subCode := p.SubjectCode
		clsName := p.ClassName
		stName := p.StudentName
		stRoll := p.StudentRollNo
		sesID := p.SessionID
		attID := p.AttendanceID
		pubID := p.PublicID

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("prf-%s", p.ID),
			Type:          models.ActivityTypeProofGenerated,
			Severity:      models.ActivitySeveritySuccess,
			Title:         "Attendance Proof Issued",
			Description:   fmt.Sprintf("Attendance proof generated for %s in %s.", p.StudentName, p.SubjectName),
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  &attID,
			ProofPublicID: &pubID,
			CreatedAt:     p.CreatedAt,
		})
	}

	return items, nil
}

// ------------------------------------------------------------------------------
// ADMIN ACTIVITY AGGREGATION
// ------------------------------------------------------------------------------
func getAdminRecentActivity(
	db *gorm.DB,
	userID string,
	startTime, endTime *time.Time,
) ([]models.ActivityItem, error) {
	var items []models.ActivityItem

	// 1. Session Lifecycle Audit Events for College
	type adminSessionAuditRow struct {
		ID             string
		SessionID      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         *string
		CreatedAt      time.Time
		SubjectName    string
		SubjectCode    string
		ClassName      string
		ActorRole      string
		ActorName      *string
	}
	var sesAuditRows []adminSessionAuditRow
	sesAuditQuery := db.Table("attendance_session_audit sa").
		Select("sa.id, sa.session_id, sa.action, sa.previous_status, sa.new_status, sa.reason, sa.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, sa.actor_role, u.name as actor_name").
		Joins("JOIN attendance_sessions ses ON ses.id = sa.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("LEFT JOIN users u ON u.id = sa.actor_user_id")

	if startTime != nil {
		sesAuditQuery = sesAuditQuery.Where("sa.created_at >= ?", *startTime)
	}
	if endTime != nil {
		sesAuditQuery = sesAuditQuery.Where("sa.created_at <= ?", *endTime)
	}
	if err := sesAuditQuery.Order("sa.created_at DESC").Limit(50).Scan(&sesAuditRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin session audit: %w", err)
	}

	for _, sa := range sesAuditRows {
		itemType := models.ActivityTypeSessionFinalized
		severity := models.ActivitySeverityInfo
		title := "Session Finalized"
		actorDisplay := "Faculty"
		if sa.ActorName != nil && *sa.ActorName != "" {
			actorDisplay = *sa.ActorName
		}
		desc := fmt.Sprintf("%s finalized attendance session for %s (%s).", actorDisplay, sa.SubjectName, sa.ClassName)

		if sa.Action == "REOPEN" {
			itemType = models.ActivityTypeSessionReopened
			severity = models.ActivitySeverityWarning
			title = "Session Reopened"
			desc = fmt.Sprintf("%s reopened attendance session for %s (%s).", actorDisplay, sa.SubjectName, sa.ClassName)
		}

		subName := sa.SubjectName
		subCode := sa.SubjectCode
		clsName := sa.ClassName
		sesID := sa.SessionID
		actRole := sa.ActorRole

		items = append(items, models.ActivityItem{
			ID:          fmt.Sprintf("sesaud-%s", sa.ID),
			Type:        itemType,
			Severity:    severity,
			Title:       title,
			Description: desc,
			ActorName:   sa.ActorName,
			ActorRole:   &actRole,
			SubjectName: &subName,
			SubjectCode: &subCode,
			ClassName:   &clsName,
			SessionID:   &sesID,
			CreatedAt:   sa.CreatedAt,
		})
	}

	// 2. Attendance Audit Records (Manual marks / corrections across College)
	type adminAuditRow struct {
		ID             string
		AttendanceID   *string
		SessionID      string
		Action         string
		PreviousStatus *string
		NewStatus      string
		Reason         string
		CreatedAt      time.Time
		SubjectName    string
		SubjectCode    string
		ClassName      string
		StudentName    string
		StudentRollNo  string
		ActorRole      string
		ActorName      *string
	}
	var auditRows []adminAuditRow
	auditQuery := db.Table("attendance_audit au").
		Select("au.id, au.attendance_id, au.session_id, au.action, au.previous_status, au.new_status, au.reason, au.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no, au.actor_role, u.name as actor_name").
		Joins("JOIN attendance_sessions ses ON ses.id = au.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = au.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id").
		Joins("LEFT JOIN users u ON u.id = au.actor_user_id")

	if startTime != nil {
		auditQuery = auditQuery.Where("au.created_at >= ?", *startTime)
	}
	if endTime != nil {
		auditQuery = auditQuery.Where("au.created_at <= ?", *endTime)
	}
	if err := auditQuery.Order("au.created_at DESC").Limit(50).Scan(&auditRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin attendance audit: %w", err)
	}

	for _, a := range auditRows {
		itemType := models.ActivityTypeAttendanceCorrected
		severity := models.ActivitySeverityImportant
		title := "Attendance Corrected"
		prev := "ABSENT"
		if a.PreviousStatus != nil && *a.PreviousStatus != "" {
			prev = *a.PreviousStatus
		}
		actorDisplay := "Administrator"
		if a.ActorName != nil && *a.ActorName != "" {
			actorDisplay = *a.ActorName
		}
		desc := fmt.Sprintf("%s corrected attendance for %s (%s → %s) in %s.", actorDisplay, a.StudentName, prev, a.NewStatus, a.SubjectName)

		if a.Action == "MANUAL_MARK" {
			itemType = models.ActivityTypeManualAttendance
			title = "Manual Attendance Mark"
			desc = fmt.Sprintf("%s recorded manual attendance (%s) for %s in %s.", actorDisplay, a.NewStatus, a.StudentName, a.SubjectName)
		}

		subName := a.SubjectName
		subCode := a.SubjectCode
		clsName := a.ClassName
		stName := a.StudentName
		stRoll := a.StudentRollNo
		sesID := a.SessionID
		actRole := a.ActorRole

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("aud-%s", a.ID),
			Type:          itemType,
			Severity:      severity,
			Title:         title,
			Description:   desc,
			ActorName:     a.ActorName,
			ActorRole:     &actRole,
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  a.AttendanceID,
			CreatedAt:     a.CreatedAt,
		})
	}

	// 3. Sessions Started in College
	type adminSessionRow struct {
		ID          string
		StartedAt   time.Time
		SubjectName string
		SubjectCode string
		ClassName   string
		TeacherName *string
	}
	var sessionRows []adminSessionRow
	sesQuery := db.Table("attendance_sessions ses").
		Select("ses.id, ses.started_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, u.name as teacher_name").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN teachers t ON t.id = ses.teacher_id").
		Joins("JOIN users u ON u.id = t.user_id")

	if startTime != nil {
		sesQuery = sesQuery.Where("ses.started_at >= ?", *startTime)
	}
	if endTime != nil {
		sesQuery = sesQuery.Where("ses.started_at <= ?", *endTime)
	}
	if err := sesQuery.Order("ses.started_at DESC").Limit(40).Scan(&sessionRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin sessions: %w", err)
	}

	for _, s := range sessionRows {
		subName := s.SubjectName
		subCode := s.SubjectCode
		clsName := s.ClassName
		sesID := s.ID
		tName := "Faculty"
		if s.TeacherName != nil && *s.TeacherName != "" {
			tName = *s.TeacherName
		}

		items = append(items, models.ActivityItem{
			ID:          fmt.Sprintf("ses-%s", s.ID),
			Type:        models.ActivityTypeSessionStarted,
			Severity:    models.ActivitySeverityInfo,
			Title:       "Session Started",
			Description: fmt.Sprintf("Session started for %s (%s) by %s.", s.SubjectName, s.ClassName, tName),
			SubjectName: &subName,
			SubjectCode: &subCode,
			ClassName:   &clsName,
			SessionID:   &sesID,
			CreatedAt:   s.StartedAt,
		})
	}

	// 4. Late Check-ins across College
	type adminAttRow struct {
		ID            string
		SessionID     string
		Status        string
		MarkedAt      time.Time
		SubjectName   string
		SubjectCode   string
		ClassName     string
		StudentName   string
		StudentRollNo string
	}
	var attRows []adminAttRow
	attQuery := db.Table("attendance a").
		Select("a.id, a.session_id, a.status, a.marked_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = a.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id").
		Where("a.status = 'LATE'")

	if startTime != nil {
		attQuery = attQuery.Where("a.marked_at >= ?", *startTime)
	}
	if endTime != nil {
		attQuery = attQuery.Where("a.marked_at <= ?", *endTime)
	}
	if err := attQuery.Order("a.marked_at DESC").Limit(50).Scan(&attRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin late attendance: %w", err)
	}

	for _, r := range attRows {
		subName := r.SubjectName
		subCode := r.SubjectCode
		clsName := r.ClassName
		stName := r.StudentName
		stRoll := r.StudentRollNo
		sesID := r.SessionID
		attID := r.ID

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("att-%s", r.ID),
			Type:          models.ActivityTypeAttendanceLate,
			Severity:      models.ActivitySeverityWarning,
			Title:         "Late Attendance Recorded",
			Description:   fmt.Sprintf("%s was marked LATE in %s (%s).", r.StudentName, r.SubjectName, r.ClassName),
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  &attID,
			CreatedAt:     r.MarkedAt,
		})
	}

	// 5. Digital Proofs across College
	type adminProofRow struct {
		ID            string
		PublicID      string
		AttendanceID  string
		CreatedAt     time.Time
		SubjectName   string
		SubjectCode   string
		ClassName     string
		StudentName   string
		StudentRollNo string
		SessionID     string
	}
	var proofRows []adminProofRow
	proofQuery := db.Table("attendance_proofs pr").
		Select("pr.id, pr.public_id, pr.attendance_id, pr.created_at, sub.name as subject_name, sub.code as subject_code, cls.name as class_name, stu.name as student_name, st.roll_number as student_roll_no, ses.id as session_id").
		Joins("JOIN attendance a ON a.id = pr.attendance_id").
		Joins("JOIN attendance_sessions ses ON ses.id = a.session_id").
		Joins("JOIN subjects sub ON sub.id = ses.subject_id").
		Joins("JOIN classes cls ON cls.id = ses.class_id").
		Joins("JOIN students st ON st.id = a.student_id").
		Joins("JOIN users stu ON stu.id = st.user_id")

	if startTime != nil {
		proofQuery = proofQuery.Where("pr.created_at >= ?", *startTime)
	}
	if endTime != nil {
		proofQuery = proofQuery.Where("pr.created_at <= ?", *endTime)
	}
	if err := proofQuery.Order("pr.created_at DESC").Limit(30).Scan(&proofRows).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch admin proofs: %w", err)
	}

	for _, p := range proofRows {
		subName := p.SubjectName
		subCode := p.SubjectCode
		clsName := p.ClassName
		stName := p.StudentName
		stRoll := p.StudentRollNo
		sesID := p.SessionID
		attID := p.AttendanceID
		pubID := p.PublicID

		items = append(items, models.ActivityItem{
			ID:            fmt.Sprintf("prf-%s", p.ID),
			Type:          models.ActivityTypeProofGenerated,
			Severity:      models.ActivitySeveritySuccess,
			Title:         "Attendance Proof Generated",
			Description:   fmt.Sprintf("Attendance proof generated for %s in %s.", p.StudentName, p.SubjectName),
			StudentName:   &stName,
			StudentRollNo: &stRoll,
			SubjectName:   &subName,
			SubjectCode:   &subCode,
			ClassName:     &clsName,
			SessionID:     &sesID,
			AttendanceID:  &attID,
			ProofPublicID: &pubID,
			CreatedAt:     p.CreatedAt,
		})
	}

	return items, nil
}
