/// <reference types="vite/client" />
import { HealthCheckResponse } from '../types';

export const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) 
  ? import.meta.env.VITE_BACKEND_URL 
  : 'http://localhost:8080';

/**
 * Fetch health check status from the backend Go API
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to parse the response body if it's a degraded service response
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
