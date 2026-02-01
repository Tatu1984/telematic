// Request/Response interceptors for API client
import { getAuthToken } from '@/config/api.config';
import type { ApiError } from './types';

/**
 * Add authentication header to request
 */
export function addAuthHeader(headers: Headers): Headers {
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * Add common headers to request
 */
export function addCommonHeaders(headers: Headers): Headers {
  headers.set('Content-Type', 'application/json');
  return headers;
}

/**
 * Handle response errors
 */
export async function handleResponseError(response: Response): Promise<ApiError> {
  let errorData: ApiError = {
    message: 'An unexpected error occurred',
    status: response.status,
  };

  try {
    const data = await response.json();
    errorData = {
      message: data.message || data.error || errorData.message,
      code: data.code,
      status: response.status,
      details: data.details,
    };
  } catch {
    // Response wasn't JSON
    errorData.message = response.statusText || errorData.message;
  }

  return errorData;
}

/**
 * Handle 401 Unauthorized - redirect to login
 */
export function handleUnauthorized(): void {
  if (typeof window !== 'undefined') {
    // Clear any stored tokens
    localStorage.removeItem('auth_token');
    // Redirect to login
    window.location.href = '/login';
  }
}
