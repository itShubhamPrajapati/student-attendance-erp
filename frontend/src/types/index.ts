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




