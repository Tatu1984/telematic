// API Client - Single source of truth for backend communication
import { getApiBaseUrl } from '@/config/api.config';
import { addAuthHeader, addCommonHeaders, handleResponseError, handleUnauthorized } from './interceptors';
import type { ApiResponse, RequestConfig, ApiError } from './types';

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = getApiBaseUrl();
    this.defaultTimeout = 30000;
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseUrl.startsWith('http') ? this.baseUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${this.baseUrl}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build headers for request
   */
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    let headers = new Headers(customHeaders);
    headers = addCommonHeaders(headers);
    headers = addAuthHeader(headers);
    return headers;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    config?: RequestConfig & { body?: unknown }
  ): Promise<T> {
    const { headers: customHeaders, params, timeout, signal, body } = config || {};

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(customHeaders);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
        }

        const error = await handleResponseError(response);
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT',
        } as ApiError;
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, config);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, { ...config, body: data });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, { ...config, body: data });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, { ...config, body: data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Also export the class for testing
export { ApiClient };
