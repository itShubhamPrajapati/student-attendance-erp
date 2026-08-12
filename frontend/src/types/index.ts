export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  email: string;
  roll_number: string;
  department: string;
  semester: number;
  section: string;
  class_id?: string | null;
  class_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  name: string;
  email: string;
  employee_id: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
  student_count?: number;
  created_at: string;
}

export interface ClassBrief {
  id: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
}

export interface TeachingAssignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_employee_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
  class_name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
  created_at: string;
}

export interface TeacherAssignmentItem {
  assignment_id: string;
  subject_id: string;
  subject: string;
  code: string;
  class_id: string;
  class: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
}

export interface TeacherProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  employee_id: string;
  department: string;
  is_active: boolean;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  roll_number: string;
  department: string;
  semester: number;
  section: string;
  class?: ClassBrief | null;
}

export interface DashboardStats {
  success: boolean;
  students: {
    total: number;
    active: number;
  };
  teachers: {
    total: number;
    active: number;
  };
  subjects: {
    total: number;
  };
  classes: {
    total: number;
  };
  recent_assignments?: TeachingAssignment[];
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  database: 'connected' | 'disconnected' | 'unavailable';
}

export interface ConnectionState {
  backendConnected: boolean;
  databaseConnected: boolean;
  loading: boolean;
  lastChecked: Date | null;
  error?: string;
}

// Creation & Update Payloads
export interface CreateStudentPayload {
  name: string;
  email: string;
  password?: string;
  roll_number: string;
  department: string;
  semester: number;
  section: string;
}

export interface UpdateStudentPayload {
  name: string;
  email: string;
  roll_number: string;
  department: string;
  semester: number;
  section: string;
}

export interface CreateTeacherPayload {
  name: string;
  email: string;
  password?: string;
  employee_id: string;
  department: string;
}

export interface UpdateTeacherPayload {
  name: string;
  email: string;
  employee_id: string;
  department: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  department: string;
  semester: number;
}

export interface UpdateSubjectPayload {
  name: string;
  code: string;
  department: string;
  semester: number;
}

export interface CreateClassPayload {
  name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
}

export interface UpdateClassPayload {
  name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
}

export interface CreateAssignmentPayload {
  teacher_id: string;
  subject_id: string;
  class_id: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';
export type AttendanceSessionFinalizationStatus = 'OPEN' | 'FINALIZED';

export interface AttendanceSession {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_employee_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
  class_name: string;
  department: string;
  semester: number;
  section: string;
  academic_year: string;
  session_token: string;
  started_at: string;
  expires_at: string;
  late_threshold_minutes: number;
  late_after?: string;
  duration_minutes?: number;
  finalization_status?: AttendanceSessionFinalizationStatus;
  finalized_at?: string | null;
  finalized_by?: string | null;
  finalized_by_name?: string | null;
  is_active: boolean;
  is_expired: boolean;
  present_count: number;
  late_count: number;
  absent_count?: number;
  total_students: number;
  percentage: number;
  late_percentage: number;
  status?: string;
  created_at: string;
}

export interface AttendanceStudentRecord {
  attendance_id?: string | null;
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  marked_at?: string | null;
}

export interface SessionAttendanceDetails {
  session: AttendanceSession;
  records: AttendanceStudentRecord[];
  present_count: number;
  late_count: number;
  total_students: number;
  percentage: number;
  late_percentage: number;
}

export interface LiveAttendanceSessionData {
  session_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | string;
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_percentage: number;
  late_percentage: number;
  late_threshold_minutes: number;
  late_after?: string;
  finalization_status?: AttendanceSessionFinalizationStatus;
  finalized_at?: string | null;
  finalized_by?: string | null;
  finalized_by_name?: string | null;
  qr_expires_at: string;
  started_at: string;
  duration_minutes: number;
  is_active: boolean;
  is_expired: boolean;
  subject_name: string;
  subject_code: string;
  class_name: string;
  semester: number;
  section: string;
  students: AttendanceStudentRecord[];
}

export interface MarkAttendanceResponse {
  attendance_id?: string;
  proof_id?: string;
  proof_public_id?: string;
  session_id?: string;
  marked_at: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  status: AttendanceStatus | string;
  late_threshold_minutes?: number;
  is_late?: boolean;
  late_cutoff?: string;
}

export interface SubjectAttendanceStat {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  present_sessions: number;
  late_sessions: number;
  absent_sessions: number;
  total_sessions: number;
  percentage: number;
  late_percentage: number;
}

export interface StudentAttendanceSummary {
  overall_percentage: number;
  total_sessions: number;
  total_present: number;
  total_late: number;
  total_absent: number;
  late_percentage: number;
  subjects: SubjectAttendanceStat[];
}

export interface StudentRecentAttendanceItem {
  attendance_id?: string;
  session_id: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  marked_at: string;
  status: AttendanceStatus | string;
}

export interface StudentCalendarSessionItem {
  session_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  status: AttendanceStatus;
  marked_at: string | null;
  started_at: string;
}

export interface StudentCalendarDay {
  date: string; // "YYYY-MM-DD"
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'PARTIAL';
  sessions: StudentCalendarSessionItem[];
}

export interface StudentCalendarSummary {
  sessions_held: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
  late_percentage: number;
}

export interface StudentCalendarResponse {
  month: string; // "YYYY-MM"
  summary: StudentCalendarSummary;
  days: StudentCalendarDay[];
}

export interface StudentAttendanceHistoryRecord {
  attendance_id?: string | null;
  session_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
  class_name: string;
  started_at: string;
  ended_at: string;
  status: AttendanceStatus;
  marked_at: string | null;
}

export interface StudentAttendanceHistoryPagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
}

export interface StudentAttendanceHistorySummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
  late_percentage: number;
}

export interface StudentAttendanceHistoryResponse {
  records: StudentAttendanceHistoryRecord[];
  pagination: StudentAttendanceHistoryPagination;
  summary: StudentAttendanceHistorySummary;
}

export interface StudentAttendanceAnalyticsSummary {
  overall_percentage: number;
  total_sessions: number;
  total_present: number;
  total_late: number;
  total_absent: number;
  late_percentage: number;
  total_subjects: number;
  subjects_below_requirement: number;
  subjects_critical: number;
  min_threshold: number;
  critical_threshold: number;
}

export interface StudentAttendanceMonthlyStat {
  month: string;
  sessions: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
  late_percentage: number;
}

export interface StudentAttendanceAnalyticsSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_sessions: number;
  present_sessions: number;
  late_sessions: number;
  absent_sessions: number;
  percentage: number;
  late_percentage: number;
  status: 'REQUIREMENT_MET' | 'BELOW_REQUIREMENT' | 'CRITICAL';
}

export interface StudentAttendanceTrend {
  status: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'INSUFFICIENT_DATA';
  difference_percentage_points: number;
  previous_percentage: number | null;
  current_percentage: number | null;
}

export interface StudentAttendanceProjection {
  required_percentage: number;
  classes_needed: number | null;
  is_meeting_requirement: boolean;
}

export interface StudentAttendanceComparison {
  best_subject_id: string | null;
  best_subject_name: string;
  best_percentage: number | null;
  lowest_subject_id: string | null;
  lowest_subject_name: string;
  lowest_percentage: number | null;
  subjects_meeting_requirement: number;
  subjects_below_requirement: number;
  subjects_critical: number;
}

export interface StudentAttendanceAbsenceAnalysis {
  total_absent: number;
  absence_percentage: number;
  highest_absence_subject_id: string | null;
  highest_absence_subject_name: string;
  highest_absence_count: number;
  subjects_affected_count: number;
}

export interface StudentAttendanceAnalyticsFilterInfo {
  subject_id?: string;
  from?: string;
  to?: string;
}

export interface StudentAttendanceAnalyticsResponse {
  summary: StudentAttendanceAnalyticsSummary;
  trend: StudentAttendanceTrend;
  projection: StudentAttendanceProjection;
  monthly: StudentAttendanceMonthlyStat[];
  subjects: StudentAttendanceAnalyticsSubject[];
  comparison: StudentAttendanceComparison;
  absence: StudentAttendanceAbsenceAnalysis;
  filters: StudentAttendanceAnalyticsFilterInfo;
}

export interface TeacherStudentSearchItem {
  student_id: string;
  user_id: string;
  name: string;
  roll_number: string;
  email: string;
  class_id: string;
  class_name: string;
  department: string;
  semester: number;
  section: string;
  attendance_percentage: number;
  late_percentage: number;
  present: number;
  late: number;
  absent: number;
  total_sessions: number;
  status: 'REQUIREMENT_MET' | 'BELOW_REQUIREMENT' | 'CRITICAL';
}

export interface TeacherStudentSearchSummary {
  total_students: number;
  students_meeting_requirement: number;
  students_below_requirement: number;
  students_critical: number;
}

export interface TeacherStudentSearchPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface TeacherStudentSearchResponse {
  items: TeacherStudentSearchItem[];
  pagination: TeacherStudentSearchPagination;
  summary: TeacherStudentSearchSummary;
}

export interface TeacherStudentBriefInfo {
  id: string;
  user_id: string;
  name: string;
  roll_number: string;
  email: string;
  class_id: string;
  class_name: string;
  department: string;
  semester: number;
  section: string;
}

export interface TeacherStudentAttendanceDetailSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
  late_percentage: number;
  status: 'REQUIREMENT_MET' | 'BELOW_REQUIREMENT' | 'CRITICAL';
}

export interface TeacherStudentAttendanceDetailSummary {
  overall_percentage: number;
  total_sessions: number;
  total_present: number;
  total_late: number;
  total_absent: number;
  late_percentage: number;
  status: string;
}

export interface TeacherStudentAttendanceDetailHistoryRecord {
  attendance_id?: string | null;
  session_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  started_at: string;
  ended_at: string;
  status: AttendanceStatus;
  marked_at: string | null;
}

export interface TeacherStudentAttendanceDetailHistory {
  records: TeacherStudentAttendanceDetailHistoryRecord[];
  pagination: StudentAttendanceHistoryPagination;
}

export interface TeacherStudentAttendanceDetailResponse {
  student: TeacherStudentBriefInfo;
  summary: TeacherStudentAttendanceDetailSummary;
  subjects: TeacherStudentAttendanceDetailSubject[];
  history: TeacherStudentAttendanceDetailHistory;
}

export interface CreateAttendanceSessionPayload {
  subject_id: string;
  class_id: string;
  duration_minutes: number;
  late_threshold_minutes?: number;
}

export interface UpdateLateSettingsPayload {
  late_threshold_minutes: number;
}

export interface UpdateLateSettingsResponse {
  session_id: string;
  late_threshold_minutes: number;
  late_after: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type AttendanceExportFormat = 'csv' | 'excel' | 'pdf';

// ==============================================================================
// Feature #11: Manual Attendance & Attendance Correction Types
// ==============================================================================

export interface ManualAttendancePayload {
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  reason: string;
}

export interface CorrectAttendancePayload {
  status: AttendanceStatus;
  reason: string;
}

export interface AttendanceAuditItem {
  id: string;
  college_id?: string | null;
  attendance_id?: string | null;
  session_id: string;
  student_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: 'MANUAL_MARK' | 'CORRECTION';
  previous_status?: string | null;
  new_status: string;
  reason: string;
  created_at: string;
}

export interface ManualAttendanceResponse {
  attendance_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
  action: string;
  reason: string;
}

// ==============================================================================
// Feature #13: Attendance Session Finalization, Locking & Reopening Types
// ==============================================================================

export interface FinalizeSessionPayload {
  reason?: string;
}

export interface FinalizeSessionResponse {
  session_id: string;
  finalization_status: AttendanceSessionFinalizationStatus;
  finalized_at: string;
  finalized_by: string;
  finalized_by_name?: string;
}

export interface ReopenSessionPayload {
  reason: string;
}

export interface ReopenSessionResponse {
  session_id: string;
  finalization_status: AttendanceSessionFinalizationStatus;
  reopened_at: string;
  reopened_by: string;
  reopened_by_name: string;
  reason: string;
}

export interface SessionAuditItem {
  id: string;
  college_id?: string | null;
  session_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: 'FINALIZE' | 'REOPEN';
  previous_status?: string | null;
  new_status: string;
  reason?: string | null;
  created_at: string;
}

// ==============================================================================
// ATTENDANCE PROOF & DIGITAL RECEIPT TYPES (Feature #14)
// ==============================================================================

export interface AttendanceProof {
  proof_id: string;
  public_id: string;
  verification_url: string;
  verification_status: 'VALID' | 'INVALID';
  attendance_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  teacher_department: string;
  session_id: string;
  session_date: string;
  session_start_time: string;
  session_end_time: string;
  attendance_marked_at: string;
  attendance_status: AttendanceStatus | string;
  status_label: string;
  late_threshold_minutes: number;
  college_name: string;
  generated_at: string;
}

export interface AttendanceProofVerification {
  valid: boolean;
  verification_status: 'VALID' | 'INVALID';
  public_id?: string;
  student_name?: string;
  roll_number?: string;
  department?: string;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  session_date?: string;
  attendance_marked_at?: string;
  attendance_status?: string;
  status_label?: string;
  college_name?: string;
  verified_at: string;
  message: string;
}

// ==============================================================================
// TEACHER ATTENDANCE ANALYTICS & CLASS PERFORMANCE INSIGHTS (Feature #15)
// ==============================================================================

export interface TeacherAttendanceAnalyticsParams {
  class_id?: string;
  subject_id?: string;
  from?: string;
  to?: string;
  period?: 'today' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days' | 'current_semester' | 'custom' | string;
  finalization_status?: 'ALL' | 'OPEN' | 'FINALIZED' | string;
}

export interface TeacherAttendanceAnalyticsSummary {
  total_classes: number;
  total_subjects: number;
  total_students: number;
  total_sessions: number;
  total_present: number;
  total_late: number;
  total_absent: number;
  total_attended: number;
  attendance_percentage: number;
  late_percentage: number;
  below_requirement_students: number;
  critical_students: number;
  open_sessions: number;
  finalized_sessions: number;
}

export interface TeacherAttendanceClassStat {
  class_id: string;
  class_name: string;
  department: string;
  semester: number;
  section: string;
  total_students: number;
  total_sessions: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
  below_requirement_students: number;
  critical_students: number;
}

export interface TeacherAttendanceSubjectStat {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  classes_count: number;
  total_sessions: number;
  total_students: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
  below_requirement_students: number;
  critical_students: number;
}

export interface TeacherAttendanceStandingDistribution {
  requirement_met: number;
  below_requirement: number;
  critical: number;
  total_evaluated: number;
}

export interface TeacherAttendanceStudentStat {
  student_id: string;
  user_id: string;
  name: string;
  roll_number: string;
  email: string;
  class_id: string;
  class_name: string;
  department: string;
  total_sessions: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
  status: 'REQUIREMENT_MET' | 'BELOW_REQUIREMENT' | 'CRITICAL' | string;
}

export interface TeacherAttendanceLateAnalysis {
  total_late: number;
  late_percentage: number;
  most_late_student?: TeacherAttendanceStudentStat | null;
  highest_late_class?: TeacherAttendanceClassStat | null;
  highest_late_subject?: TeacherAttendanceSubjectStat | null;
}

export interface TeacherAttendanceMonthlyTrend {
  month: string;
  month_label: string;
  total_sessions: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
}

export interface TeacherAttendanceWeeklyTrend {
  day_of_week: number;
  day_name: string;
  total_sessions: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
}

export interface TeacherAttendanceSessionPerformance {
  session_id: string;
  started_at: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
  class_name: string;
  total_students: number;
  present: number;
  late: number;
  absent: number;
  attendance_percentage: number;
  late_percentage: number;
  finalization_status: 'OPEN' | 'FINALIZED' | string;
  finalized_at?: string | null;
}

export interface TeacherAttendanceCorrectionSummary {
  total_manual_marks: number;
  total_corrections: number;
  present_to_late: number;
  late_to_present: number;
  absent_to_present: number;
  absent_to_late: number;
  other_corrections: number;
}

export interface TeacherAttendanceAnalyticsFilterInfo {
  class_id?: string | null;
  class_name?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  from?: string | null;
  to?: string | null;
  period: string;
  finalization_status: string;
}

export interface TeacherAttendanceAnalyticsResponse {
  summary: TeacherAttendanceAnalyticsSummary;
  monthly_trend: TeacherAttendanceMonthlyTrend[];
  weekly_trend: TeacherAttendanceWeeklyTrend[];
  classes: TeacherAttendanceClassStat[];
  subjects: TeacherAttendanceSubjectStat[];
  distribution: TeacherAttendanceStandingDistribution;
  top_students: TeacherAttendanceStudentStat[];
  attention_students: TeacherAttendanceStudentStat[];
  late_analysis: TeacherAttendanceLateAnalysis;
  recent_sessions: TeacherAttendanceSessionPerformance[];
  corrections: TeacherAttendanceCorrectionSummary;
  filters: TeacherAttendanceAnalyticsFilterInfo;
}

// ==============================================================================
// RECENT ACTIVITY & ATTENDANCE ACTIVITY FEED (Feature #16)
// ==============================================================================

export type ActivityType =
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_LATE'
  | 'ATTENDANCE_CORRECTED'
  | 'MANUAL_ATTENDANCE'
  | 'SESSION_STARTED'
  | 'SESSION_FINALIZED'
  | 'SESSION_REOPENED'
  | 'ATTENDANCE_PROOF_GENERATED'
  | 'ATTENDANCE_SESSION_COMPLETED'
  | string;

export type ActivitySeverity = 'SUCCESS' | 'WARNING' | 'IMPORTANT' | 'INFO';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  severity: ActivitySeverity;
  title: string;
  description: string;
  actor_name?: string | null;
  actor_role?: string | null;
  student_name?: string | null;
  student_roll_number?: string | null;
  subject_name?: string | null;
  subject_code?: string | null;
  class_name?: string | null;
  session_id?: string | null;
  attendance_id?: string | null;
  proof_public_id?: string | null;
  created_at: string;
}

export interface RecentActivityParams {
  limit?: number;
  page?: number;
  type?: string;
  from?: string;
  to?: string;
}

export interface RecentActivityResponse {
  activities: ActivityItem[];
  total: number;
  limit: number;
  page: number;
}
