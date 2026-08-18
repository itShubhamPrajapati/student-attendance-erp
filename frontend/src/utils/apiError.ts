/**
 * Safe API Error Handling and Classification Utility
 * Feature #17: Professional Loading, Error & Empty States
 */

export type ApiErrorCategory =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export class ApiError extends Error {
  status?: number;
  category: ApiErrorCategory;
  rawDetails?: string;

  constructor(message: string, status?: number, rawDetails?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.rawDetails = rawDetails;
    this.category = classifyStatus(status, message);
  }
}

/**
 * Classifies HTTP status or error message into standard semantic category
 */
export function classifyStatus(status?: number, message?: string): ApiErrorCategory {
  if (!status) {
    const msg = (message || '').toLowerCase();
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network error') ||
      msg.includes('connection refused') ||
      msg.includes('network request failed') ||
      msg.includes('load failed')
    ) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN';
  }

  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'SERVER_ERROR';

  return 'UNKNOWN';
}

/**
 * Strips raw SQL/stack-traces and converts any error into a safe, human-readable user message
 */
export function apiErrorToUserMessage(error: unknown, fallbackAction: string = 'Please try again.'): string {
  if (!error) return fallbackAction;

  let message = '';
  let status: number | undefined;

  if (error instanceof ApiError) {
    message = error.message;
    status = error.status;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  const category = classifyStatus(status, message);

  // Check if raw error message contains raw SQL / internal database error patterns
  const isRawInternalError =
    message.includes('SQLSTATE') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('gorm:') ||
    message.includes('pq:') ||
    message.includes('syntax error') ||
    message.includes('panic:') ||
    message.includes('runtime error:');

  if (isRawInternalError) {
    return 'The server encountered an unexpected error while processing your request. Please try again or contact support.';
  }

  switch (category) {
    case 'NETWORK_ERROR':
      return 'Unable to reach the server. Please check your internet connection and try again.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please sign in again to continue.';
    case 'FORBIDDEN':
      return 'You do not have permission to access or modify this resource.';
    case 'NOT_FOUND':
      return 'The requested record or resource could not be found.';
    case 'CONFLICT':
      return 'This record was modified by another operation. Please refresh the page and try again.';
    case 'VALIDATION_ERROR':
      // If validation error is a clean human message, preserve it
      if (message && message.length < 150 && !message.includes('{') && !message.includes('http')) {
        return message;
      }
      return 'Please check the information you entered and try again.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment before trying again.';
    case 'SERVER_ERROR':
      return 'An unexpected server error occurred. Our team has been notified. Please try again shortly.';
    default:
      if (message && message.length < 120 && !message.includes('{') && !message.includes('http')) {
        return message;
      }
      return `Something went wrong. ${fallbackAction}`;
  }
}
