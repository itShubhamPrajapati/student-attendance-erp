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
  duration_minutes?: number;
  is_active: boolean;
  is_expired: boolean;
  present_count: number;
  absent_count?: number;
  total_students: number;
  percentage: number;
  status?: string;
  created_at: string;
}

export interface AttendanceStudentRecord {
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  status: 'PRESENT' | 'ABSENT';
  marked_at?: string | null;
}

export interface SessionAttendanceDetails {
  session: AttendanceSession;
  records: AttendanceStudentRecord[];
  present_count: number;
  total_students: number;
  percentage: number;
}

export interface LiveAttendanceSessionData {
  session_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | string;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
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
  marked_at: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  status: string;
}

export interface SubjectAttendanceStat {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  present_sessions: number;
  total_sessions: number;
  percentage: number;
}

export interface StudentAttendanceSummary {
  overall_percentage: number;
  total_sessions: number;
  total_present: number;
  subjects: SubjectAttendanceStat[];
}

export interface StudentRecentAttendanceItem {
  session_id: string;
  subject_name: string;
  subject_code: string;
  class_name: string;
  marked_at: string;
  status: string;
}

export interface CreateAttendanceSessionPayload {
  subject_id: string;
  class_id: string;
  duration_minutes: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

