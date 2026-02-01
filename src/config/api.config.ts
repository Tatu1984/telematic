// API Configuration - Easy to switch between mock and real backend
import { ENV } from './env.config';

export const API_CONFIG = {
  // Development: Use Next.js API routes
  // Production: Can use real backend if configured
  BASE_URL: ENV.API_URL || '/api',
  WS_URL: ENV.WS_URL || '',
  TIMEOUT: 30000,
} as const;

/**
 * Get the base URL for API calls
 * Automatically switches between Next.js API routes and real backend
 */
export function getApiBaseUrl(): string {
  if (ENV.USE_REAL_BACKEND && ENV.API_URL) {
    return ENV.API_URL;
  }
  // Use Next.js API routes
  return '/api';
}

/**
 * Get the WebSocket URL
 */
export function getWebSocketUrl(): string {
  return API_CONFIG.WS_URL;
}

/**
 * Get auth token from storage (client-side only)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token in storage (client-side only)
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove auth token from storage (client-side only)
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}
