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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
