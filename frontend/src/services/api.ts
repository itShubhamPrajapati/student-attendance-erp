import {
  HealthCheckResponse,
  User,
  Student,
  Teacher,
  Subject,
  Class,
  TeachingAssignment,
  TeacherAssignmentItem,
  TeacherProfile,
  StudentProfile,
  DashboardStats,
  CreateStudentPayload,
  UpdateStudentPayload,
  CreateTeacherPayload,
  UpdateTeacherPayload,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  CreateClassPayload,
  UpdateClassPayload,
  CreateAssignmentPayload,
  AttendanceSession,
  SessionAttendanceDetails,
  MarkAttendanceResponse,
  StudentAttendanceSummary,
  StudentRecentAttendanceItem,
  CreateAttendanceSessionPayload,
} from '../types';
import { getToken } from '../auth/authService';

export function getBackendBaseUrl(): string {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    '';

  if (envUrl && envUrl.trim() !== '') {
    // Strip trailing slashes and trailing /api to ensure clean `${baseUrl}${endpoint}` concatenation
    return envUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }

  // Browser hostname resolution for local and LAN testing
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    // If on a private LAN IP (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)) {
      return `${window.location.protocol}//${host}:8080`;
    }
  }

  return 'http://localhost:8080';
}

export const BACKEND_URL = getBackendBaseUrl();

/**
 * Generic fetch wrapper attaching JSON headers and Authorization Bearer token if present
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

/**
 * Health check status from the backend Go API
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const baseUrl = getBackendBaseUrl();
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          status: 'error',
          message: errorData.message || 'API returned an error response',
          database: errorData.database || 'disconnected',
        };
      } catch {
        return {
          status: 'error',
          message: `Backend returned HTTP status ${response.status}`,
          database: 'disconnected',
        };
      }
    }

    const data: HealthCheckResponse = await response.json();
    return data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return {
      status: 'error',
      message: `Unable to connect to backend: ${errorMsg}`,
      database: 'unavailable',
    };
  }
}

/**
 * Authentication API Requests
 */
export async function apiLogin(email: string, password: string): Promise<{
  success: boolean;
  message: string;
  token: string;
  user: User;
}> {
  return request<{
    success: boolean;
    message: string;
    token: string;
    user: User;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGetMe(): Promise<{ success: boolean; user: User }> {
  return request<{ success: boolean; user: User }>('/api/auth/me', {
    method: 'GET',
  });
}

/**
 * Admin Dashboard & Master Data APIs
 */
export async function apiGetAdminDashboard(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/admin/dashboard', {
    method: 'GET',
  });
}

// Student APIs
export async function apiGetStudents(): Promise<{ success: boolean; data: Student[] }> {
  return request<{ success: boolean; data: Student[] }>('/api/admin/students', {
    method: 'GET',
  });
}

export async function apiCreateStudent(payload: CreateStudentPayload): Promise<{ success: boolean; message: string; data: Student }> {
  return request<{ success: boolean; message: string; data: Student }>('/api/admin/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateStudent(id: string, payload: UpdateStudentPayload): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiToggleStudentStatus(id: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function apiAssignStudentClass(studentId: string, classId: string | null): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/students/${studentId}/class`, {
    method: 'PATCH',
    body: JSON.stringify({ class_id: classId }),
  });
}

// Teacher APIs
export async function apiGetTeachers(): Promise<{ success: boolean; data: Teacher[] }> {
  return request<{ success: boolean; data: Teacher[] }>('/api/admin/teachers', {
    method: 'GET',
  });
}

export async function apiCreateTeacher(payload: CreateTeacherPayload): Promise<{ success: boolean; message: string; data: Teacher }> {
  return request<{ success: boolean; message: string; data: Teacher }>('/api/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateTeacher(id: string, payload: UpdateTeacherPayload): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiToggleTeacherStatus(id: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/teachers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

// Subject APIs (Phase 3)
export async function apiGetSubjects(): Promise<{ success: boolean; data: Subject[] }> {
  return request<{ success: boolean; data: Subject[] }>('/api/admin/subjects', {
    method: 'GET',
  });
}

export async function apiCreateSubject(payload: CreateSubjectPayload): Promise<{ success: boolean; message: string; data: Subject }> {
  return request<{ success: boolean; message: string; data: Subject }>('/api/admin/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSubject(id: string, payload: UpdateSubjectPayload): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSubject(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/subjects/${id}`, {
    method: 'DELETE',
  });
}

// Class APIs (Phase 3)
export async function apiGetClasses(): Promise<{ success: boolean; data: Class[] }> {
  return request<{ success: boolean; data: Class[] }>('/api/admin/classes', {
    method: 'GET',
  });
}

export async function apiCreateClass(payload: CreateClassPayload): Promise<{ success: boolean; message: string; data: Class }> {
  return request<{ success: boolean; message: string; data: Class }>('/api/admin/classes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateClass(id: string, payload: UpdateClassPayload): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteClass(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/classes/${id}`, {
    method: 'DELETE',
  });
}

// Teaching Assignment APIs (Phase 3)
export async function apiGetAssignments(): Promise<{ success: boolean; data: TeachingAssignment[] }> {
  return request<{ success: boolean; data: TeachingAssignment[] }>('/api/admin/assignments', {
    method: 'GET',
  });
}

export async function apiCreateAssignment(payload: CreateAssignmentPayload): Promise<{ success: boolean; message: string; data: TeachingAssignment }> {
  return request<{ success: boolean; message: string; data: TeachingAssignment }>('/api/admin/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteAssignment(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/admin/assignments/${id}`, {
    method: 'DELETE',
  });
}

// Teacher Portal APIs (Phase 3)
export async function apiGetTeacherProfile(): Promise<{ success: boolean; profile: TeacherProfile }> {
  return request<{ success: boolean; profile: TeacherProfile }>('/api/teacher/profile', {
    method: 'GET',
  });
}

export async function apiGetTeacherAssignments(): Promise<{ success: boolean; data: TeacherAssignmentItem[] }> {
  return request<{ success: boolean; data: TeacherAssignmentItem[] }>('/api/teacher/assignments', {
    method: 'GET',
  });
}

// Student Portal APIs (Phase 3)
export async function apiGetStudentProfile(): Promise<{ success: boolean; student: StudentProfile }> {
  return request<{ success: boolean; student: StudentProfile }>('/api/student/profile', {
    method: 'GET',
  });
}

export async function apiGetStudentSubjects(): Promise<{ success: boolean; data: Subject[] }> {
  return request<{ success: boolean; data: Subject[] }>('/api/student/subjects', {
    method: 'GET',
  });
}

// ==============================================================================
// PHASE 4: ATTENDANCE APIS
// ==============================================================================

// Teacher Live Session APIs
export async function apiCreateAttendanceSession(
  payload: CreateAttendanceSessionPayload
): Promise<{ success: boolean; message: string; data: AttendanceSession }> {
  return request<{ success: boolean; message: string; data: AttendanceSession }>(
    '/api/teacher/attendance/sessions',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function apiGetTeacherSessions(): Promise<{ success: boolean; data: AttendanceSession[] }> {
  return request<{ success: boolean; data: AttendanceSession[] }>('/api/teacher/attendance/sessions', {
    method: 'GET',
  });
}

export async function apiGetTeacherSessionDetails(
  sessionId: string
): Promise<{ success: boolean; data: AttendanceSession }> {
  return request<{ success: boolean; data: AttendanceSession }>(
    `/api/teacher/attendance/sessions/${sessionId}`,
    {
      method: 'GET',
    }
  );
}

export async function apiEndAttendanceSession(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/teacher/attendance/sessions/${sessionId}/end`,
    {
      method: 'POST',
    }
  );
}

export async function apiGetSessionAttendanceRecords(
  sessionId: string
): Promise<{ success: boolean; data: SessionAttendanceDetails }> {
  return request<{ success: boolean; data: SessionAttendanceDetails }>(
    `/api/teacher/attendance/sessions/${sessionId}/records`,
    {
      method: 'GET',
    }
  );
}

// Student QR Submission & Attendance Summary APIs
export async function apiMarkAttendance(
  sessionToken: string
): Promise<{ success: boolean; message: string; data: MarkAttendanceResponse }> {
  return request<{ success: boolean; message: string; data: MarkAttendanceResponse }>(
    '/api/attendance/mark',
    {
      method: 'POST',
      body: JSON.stringify({ session_token: sessionToken }),
    }
  );
}

export async function apiGetStudentAttendanceSummary(): Promise<{
  success: boolean;
  data: StudentAttendanceSummary;
}> {
  return request<{ success: boolean; data: StudentAttendanceSummary }>(
    '/api/student/attendance/summary',
    {
      method: 'GET',
    }
  );
}

export async function apiGetStudentRecentAttendance(): Promise<{
  success: boolean;
  data: StudentRecentAttendanceItem[];
}> {
  return request<{ success: boolean; data: StudentRecentAttendanceItem[] }>(
    '/api/student/attendance/recent',
    {
      method: 'GET',
    }
  );
}

// Admin Attendance Audit APIs
export async function apiGetAdminAttendanceSessions(params?: {
  date?: string;
  subject_id?: string;
  class_id?: string;
}): Promise<{ success: boolean; data: AttendanceSession[] }> {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set('date', params.date);
  if (params?.subject_id) searchParams.set('subject_id', params.subject_id);
  if (params?.class_id) searchParams.set('class_id', params.class_id);

  const qs = searchParams.toString();
  const endpoint = `/api/admin/attendance/sessions${qs ? `?${qs}` : ''}`;

  return request<{ success: boolean; data: AttendanceSession[] }>(endpoint, {
    method: 'GET',
  });
}

export async function apiGetAdminSessionRecords(
  sessionId: string
): Promise<{ success: boolean; data: SessionAttendanceDetails }> {
  return request<{ success: boolean; data: SessionAttendanceDetails }>(
    `/api/admin/attendance/sessions/${sessionId}/records`,
    {
      method: 'GET',
    }
  );
}

