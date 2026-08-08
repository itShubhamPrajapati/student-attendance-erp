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
  subject: string;
  code: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
