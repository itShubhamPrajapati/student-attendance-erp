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
  LiveAttendanceSessionData,
  MarkAttendanceResponse,
  StudentAttendanceSummary,
  StudentRecentAttendanceItem,
  StudentCalendarResponse,
  StudentAttendanceHistoryResponse,
  StudentAttendanceAnalyticsResponse,
  TeacherStudentSearchResponse,
  TeacherStudentAttendanceDetailResponse,
  CreateAttendanceSessionPayload,
  ManualAttendancePayload,
  CorrectAttendancePayload,
  AttendanceAuditItem,
  ManualAttendanceResponse,
  UpdateLateSettingsPayload,
  UpdateLateSettingsResponse,
  FinalizeSessionPayload,
  FinalizeSessionResponse,
  ReopenSessionPayload,
  ReopenSessionResponse,
  SessionAuditItem,
  AttendanceProof,
  AttendanceProofVerification,
  TeacherAttendanceAnalyticsParams,
  TeacherAttendanceAnalyticsResponse,
  RecentActivityParams,
  RecentActivityResponse,
} from '../types';
import { getToken } from '../auth/authService';
import { ApiError } from '../utils/apiError';

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
    throw new ApiError(errorMsg, response.status, data ? JSON.stringify(data) : undefined);
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

export async function apiGetTeacherSessions(filters?: {
  subject_id?: string;
  class_id?: string;
  date?: string;
  status?: string;
}): Promise<{ success: boolean; data: AttendanceSession[] }> {
  const params = new URLSearchParams();
  if (filters?.subject_id) params.append('subject_id', filters.subject_id);
  if (filters?.class_id) params.append('class_id', filters.class_id);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.status) params.append('status', filters.status);

  const qs = params.toString();
  const url = qs ? `/api/teacher/attendance/sessions?${qs}` : '/api/teacher/attendance/sessions';

  return request<{ success: boolean; data: AttendanceSession[] }>(url, {
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

export async function apiGetTeacherLiveSessionData(
  sessionId: string
): Promise<{ success: boolean; data: LiveAttendanceSessionData }> {
  return request<{ success: boolean; data: LiveAttendanceSessionData }>(
    `/api/teacher/attendance/sessions/${sessionId}/live`,
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

export async function apiGetStudentAttendanceCalendar(
  month?: string,
  subjectId?: string
): Promise<{
  success: boolean;
  data: StudentCalendarResponse;
}> {
  const params = new URLSearchParams();
  if (month && month.trim() !== '') {
    params.append('month', month.trim());
  }
  if (subjectId && subjectId.trim() !== '') {
    params.append('subject_id', subjectId.trim());
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return request<{ success: boolean; data: StudentCalendarResponse }>(
    `/api/student/attendance/calendar${queryString}`,
    {
      method: 'GET',
    }
  );
}

export async function apiGetStudentAttendanceHistory(params?: {
  subject_id?: string;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: StudentAttendanceHistoryResponse;
}> {
  const query = new URLSearchParams();
  if (params?.subject_id && params.subject_id.trim() !== '') {
    query.append('subject_id', params.subject_id.trim());
  }
  if (params?.status && params.status.trim() !== '') {
    query.append('status', params.status.trim());
  }
  if (params?.from && params.from.trim() !== '') {
    query.append('from', params.from.trim());
  }
  if (params?.to && params.to.trim() !== '') {
    query.append('to', params.to.trim());
  }
  if (params?.search && params.search.trim() !== '') {
    query.append('search', params.search.trim());
  }
  if (params?.page && params.page > 0) {
    query.append('page', String(params.page));
  }
  if (params?.limit && params.limit > 0) {
    query.append('limit', String(params.limit));
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request<{ success: boolean; data: StudentAttendanceHistoryResponse }>(
    `/api/student/attendance/history${queryString}`,
    {
      method: 'GET',
    }
  );
}

export async function apiGetStudentAttendanceAnalytics(params?: {
  subject_id?: string;
  from?: string;
  to?: string;
}): Promise<{ success: boolean; data: StudentAttendanceAnalyticsResponse }> {
  const query = new URLSearchParams();
  if (params?.subject_id && params.subject_id.trim() !== '') {
    query.append('subject_id', params.subject_id.trim());
  }
  if (params?.from && params.from.trim() !== '') {
    query.append('from', params.from.trim());
  }
  if (params?.to && params.to.trim() !== '') {
    query.append('to', params.to.trim());
  }

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request<{ success: boolean; data: StudentAttendanceAnalyticsResponse }>(
    `/api/student/attendance/analytics${queryString}`,
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

// Teacher Student Attendance Search & Detail APIs (Feature #9)
export async function apiSearchTeacherStudents(params?: {
  q?: string;
  class_id?: string;
  subject_id?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  order?: string;
}): Promise<{ success: boolean; data: TeacherStudentSearchResponse }> {
  const query = new URLSearchParams();
  if (params?.q && params.q.trim() !== '') {
    query.append('q', params.q.trim());
  }
  if (params?.class_id && params.class_id.trim() !== '') {
    query.append('class_id', params.class_id.trim());
  }
  if (params?.subject_id && params.subject_id.trim() !== '') {
    query.append('subject_id', params.subject_id.trim());
  }
  if (params?.status && params.status.trim() !== '') {
    query.append('status', params.status.trim());
  }
  if (params?.from && params.from.trim() !== '') {
    query.append('from', params.from.trim());
  }
  if (params?.to && params.to.trim() !== '') {
    query.append('to', params.to.trim());
  }
  if (params?.page && params.page > 0) {
    query.append('page', String(params.page));
  }
  if (params?.page_size && params.page_size > 0) {
    query.append('page_size', String(params.page_size));
  }
  if (params?.sort && params.sort.trim() !== '') {
    query.append('sort', params.sort.trim());
  }
  if (params?.order && params.order.trim() !== '') {
    query.append('order', params.order.trim());
  }

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request<{ success: boolean; data: TeacherStudentSearchResponse }>(
    `/api/teacher/students/search${qs}`,
    {
      method: 'GET',
    }
  );
}

export async function apiGetTeacherStudentAttendanceDetail(
  studentId: string,
  params?: {
    subject_id?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ success: boolean; data: TeacherStudentAttendanceDetailResponse }> {
  const query = new URLSearchParams();
  if (params?.subject_id && params.subject_id.trim() !== '') {
    query.append('subject_id', params.subject_id.trim());
  }
  if (params?.status && params.status.trim() !== '') {
    query.append('status', params.status.trim());
  }
  if (params?.from && params.from.trim() !== '') {
    query.append('from', params.from.trim());
  }
  if (params?.to && params.to.trim() !== '') {
    query.append('to', params.to.trim());
  }
  if (params?.page && params.page > 0) {
    query.append('page', String(params.page));
  }
  if (params?.limit && params.limit > 0) {
    query.append('limit', String(params.limit));
  }

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request<{ success: boolean; data: TeacherStudentAttendanceDetailResponse }>(
    `/api/teacher/students/${studentId}/attendance${qs}`,
    {
      method: 'GET',
    }
  );
}

// ==============================================================================
// ATTENDANCE REPORT EXPORT APIs (Feature #10: CSV, Excel, PDF)
// ==============================================================================

/**
 * Downloads a binary file (CSV, XLSX, PDF) securely with Authorization headers and triggers browser download
 */
async function downloadFileRequest(endpoint: string, fallbackFilename: string): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Export failed with status ${response.status}`;
    try {
      const json = await response.json();
      if (json && json.message) {
        errorMsg = json.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  let filename = fallbackFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);
}

export async function apiExportTeacherAttendance(
  format: 'csv' | 'excel' | 'pdf',
  params?: {
    q?: string;
    class_id?: string;
    subject_id?: string;
    status?: string;
    from?: string;
    to?: string;
  }
): Promise<void> {
  const query = new URLSearchParams();
  if (params?.q && params.q.trim() !== '') query.append('q', params.q.trim());
  if (params?.class_id && params.class_id.trim() !== '') query.append('class_id', params.class_id.trim());
  if (params?.subject_id && params.subject_id.trim() !== '') query.append('subject_id', params.subject_id.trim());
  if (params?.status && params.status.trim() !== '') query.append('status', params.status.trim());
  if (params?.from && params.from.trim() !== '') query.append('from', params.from.trim());
  if (params?.to && params.to.trim() !== '') query.append('to', params.to.trim());

  const qs = query.toString() ? `?${query.toString()}` : '';
  const ext = format === 'excel' ? 'xlsx' : format;
  const fallback = `attendance-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
  return downloadFileRequest(`/api/teacher/attendance/export/${format}${qs}`, fallback);
}

export async function apiExportTeacherStudentAttendance(
  studentId: string,
  format: 'csv' | 'excel' | 'pdf',
  params?: {
    subject_id?: string;
    status?: string;
    from?: string;
    to?: string;
  }
): Promise<void> {
  const query = new URLSearchParams();
  if (params?.subject_id && params.subject_id.trim() !== '') query.append('subject_id', params.subject_id.trim());
  if (params?.status && params.status.trim() !== '') query.append('status', params.status.trim());
  if (params?.from && params.from.trim() !== '') query.append('from', params.from.trim());
  if (params?.to && params.to.trim() !== '') query.append('to', params.to.trim());

  const qs = query.toString() ? `?${query.toString()}` : '';
  const ext = format === 'excel' ? 'xlsx' : format;
  const fallback = `student-attendance-${studentId}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  return downloadFileRequest(`/api/teacher/students/${studentId}/attendance/export/${format}${qs}`, fallback);
}

// ==============================================================================
// Feature #11: Manual Attendance & Correction APIs
// ==============================================================================

export async function apiMarkAttendanceManually(
  payload: ManualAttendancePayload
): Promise<{ success: boolean; message: string; data: ManualAttendanceResponse }> {
  return request<{ success: boolean; message: string; data: ManualAttendanceResponse }>(
    '/api/teacher/attendance/manual',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function apiCorrectAttendance(
  attendanceId: string,
  payload: CorrectAttendancePayload
): Promise<{ success: boolean; message: string; data: ManualAttendanceResponse }> {
  return request<{ success: boolean; message: string; data: ManualAttendanceResponse }>(
    `/api/teacher/attendance/${attendanceId}/correct`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function apiGetAttendanceAudit(
  attendanceId: string
): Promise<{ success: boolean; data: AttendanceAuditItem[] }> {
  return request<{ success: boolean; data: AttendanceAuditItem[] }>(
    `/api/teacher/attendance/${attendanceId}/audit`,
    {
      method: 'GET',
    }
  );
}

// ==============================================================================
// Feature #12: Late Attendance Configuration APIs
// ==============================================================================

export async function apiUpdateLateAttendanceSettings(
  sessionId: string,
  payload: UpdateLateSettingsPayload
): Promise<{ success: boolean; message: string; data: UpdateLateSettingsResponse }> {
  return request<{ success: boolean; message: string; data: UpdateLateSettingsResponse }>(
    `/api/teacher/attendance/sessions/${sessionId}/late-settings`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

// ==============================================================================
// Feature #13: Attendance Session Finalization, Locking & Reopening APIs
// ==============================================================================

export async function apiFinalizeTeacherSession(
  sessionId: string,
  payload?: FinalizeSessionPayload
): Promise<{ success: boolean; message: string; data: FinalizeSessionResponse }> {
  return request<{ success: boolean; message: string; data: FinalizeSessionResponse }>(
    `/api/teacher/attendance/sessions/${sessionId}/finalize`,
    {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    }
  );
}

export async function apiGetTeacherSessionAudit(
  sessionId: string
): Promise<{ success: boolean; data: SessionAuditItem[] }> {
  return request<{ success: boolean; data: SessionAuditItem[] }>(
    `/api/teacher/attendance/sessions/${sessionId}/audit`,
    {
      method: 'GET',
    }
  );
}

export async function apiFinalizeAdminSession(
  sessionId: string,
  payload?: FinalizeSessionPayload
): Promise<{ success: boolean; message: string; data: FinalizeSessionResponse }> {
  return request<{ success: boolean; message: string; data: FinalizeSessionResponse }>(
    `/api/admin/attendance/sessions/${sessionId}/finalize`,
    {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : JSON.stringify({}),
    }
  );
}

export async function apiReopenAdminSession(
  sessionId: string,
  payload: ReopenSessionPayload
): Promise<{ success: boolean; message: string; data: ReopenSessionResponse }> {
  return request<{ success: boolean; message: string; data: ReopenSessionResponse }>(
    `/api/admin/attendance/sessions/${sessionId}/reopen`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function apiGetAdminSessionAudit(
  sessionId: string
): Promise<{ success: boolean; data: SessionAuditItem[] }> {
  return request<{ success: boolean; data: SessionAuditItem[] }>(
    `/api/admin/attendance/sessions/${sessionId}/audit`,
    {
      method: 'GET',
    }
  );
}

// ==============================================================================
// Feature #14: Attendance Digital Proof & Verification APIs
// ==============================================================================

export async function apiGetStudentAttendanceProof(
  attendanceId: string
): Promise<{ success: boolean; data: AttendanceProof }> {
  return request<{ success: boolean; data: AttendanceProof }>(
    `/api/student/attendance/${attendanceId}/proof`,
    { method: 'GET' }
  );
}

export async function apiDownloadStudentAttendanceProofPDF(
  attendanceId: string,
  publicId?: string
): Promise<void> {
  const filename = `attendance-receipt-${publicId || attendanceId}.pdf`;
  return downloadFileRequest(`/api/student/attendance/${attendanceId}/proof/pdf`, filename);
}

export async function apiGetTeacherAttendanceProof(
  attendanceId: string
): Promise<{ success: boolean; data: AttendanceProof }> {
  return request<{ success: boolean; data: AttendanceProof }>(
    `/api/teacher/attendance/${attendanceId}/proof`,
    { method: 'GET' }
  );
}

export async function apiDownloadTeacherAttendanceProofPDF(
  attendanceId: string,
  publicId?: string
): Promise<void> {
  const filename = `attendance-receipt-${publicId || attendanceId}.pdf`;
  return downloadFileRequest(`/api/teacher/attendance/${attendanceId}/proof/pdf`, filename);
}

export async function apiGetAdminAttendanceProof(
  attendanceId: string
): Promise<{ success: boolean; data: AttendanceProof }> {
  return request<{ success: boolean; data: AttendanceProof }>(
    `/api/admin/attendance/${attendanceId}/proof`,
    { method: 'GET' }
  );
}

export async function apiDownloadAdminAttendanceProofPDF(
  attendanceId: string,
  publicId?: string
): Promise<void> {
  const filename = `attendance-receipt-${publicId || attendanceId}.pdf`;
  return downloadFileRequest(`/api/admin/attendance/${attendanceId}/proof/pdf`, filename);
}

export async function apiVerifyAttendanceProof(
  publicId: string
): Promise<{ success: boolean; message: string; data: AttendanceProofVerification }> {
  return request<{ success: boolean; message: string; data: AttendanceProofVerification }>(
    `/api/attendance/proof/verify/${publicId}`,
    { method: 'GET' }
  );
}

// ==============================================================================
// Feature #15: Teacher Attendance Analytics APIs
// ==============================================================================

export async function apiGetTeacherAttendanceAnalytics(
  params?: TeacherAttendanceAnalyticsParams
): Promise<{ success: boolean; data: TeacherAttendanceAnalyticsResponse }> {
  const query = new URLSearchParams();
  if (params) {
    if (params.class_id && params.class_id.trim() !== '') {
      query.append('class_id', params.class_id.trim());
    }
    if (params.subject_id && params.subject_id.trim() !== '') {
      query.append('subject_id', params.subject_id.trim());
    }
    if (params.from && params.from.trim() !== '') {
      query.append('from', params.from.trim());
    }
    if (params.to && params.to.trim() !== '') {
      query.append('to', params.to.trim());
    }
    if (params.period && params.period.trim() !== '') {
      query.append('period', params.period.trim());
    }
    if (params.finalization_status && params.finalization_status.trim() !== '') {
      query.append('finalization_status', params.finalization_status.trim());
    }
  }

  const qs = query.toString();
  const endpoint = qs ? `/api/teacher/attendance/analytics?${qs}` : '/api/teacher/attendance/analytics';
  return request<{ success: boolean; data: TeacherAttendanceAnalyticsResponse }>(endpoint, {
    method: 'GET',
  });
}

// ==============================================================================
// Feature #16: Recent Activity API
// ==============================================================================

export async function apiGetRecentActivity(
  params?: RecentActivityParams
): Promise<{ success: boolean; data: RecentActivityResponse }> {
  const query = new URLSearchParams();
  if (params) {
    if (params.limit && params.limit > 0) {
      query.append('limit', params.limit.toString());
    }
    if (params.page && params.page > 0) {
      query.append('page', params.page.toString());
    }
    if (params.type && params.type.trim() !== '') {
      query.append('type', params.type.trim());
    }
    if (params.from && params.from.trim() !== '') {
      query.append('from', params.from.trim());
    }
    if (params.to && params.to.trim() !== '') {
      query.append('to', params.to.trim());
    }
  }

  const qs = query.toString();
  const endpoint = qs ? `/api/activity/recent?${qs}` : '/api/activity/recent';
  return request<{ success: boolean; data: RecentActivityResponse }>(endpoint, {
    method: 'GET',
  });
}
