/// <reference types="vite/client" />
import {
  HealthCheckResponse,
  User,
  Student,
  Teacher,
  DashboardStats,
  CreateStudentPayload,
  UpdateStudentPayload,
  CreateTeacherPayload,
  UpdateTeacherPayload,
} from '../types';
import { getToken } from '../auth/authService';

export const BACKEND_URL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:8080';

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

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
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

    const response = await fetch(`${BACKEND_URL}/api/health`, {
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
