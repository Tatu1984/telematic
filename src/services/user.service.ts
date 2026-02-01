// User service - handles user/profile operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { User, SessionUser } from '@/types/models/User';
import type { UpdateProfileRequest, ChangePasswordRequest } from '@/types/api.types';

export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<SessionUser> {
    return apiClient.get<SessionUser>(API_ENDPOINTS.USER.PROFILE);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, data);
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<Record<string, unknown>> {
    return apiClient.get(API_ENDPOINTS.USER.PREFERENCES);
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Record<string, unknown>): Promise<void> {
    await apiClient.put(API_ENDPOINTS.USER.PREFERENCES, preferences);
  },

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<Record<string, boolean>> {
    return apiClient.get(API_ENDPOINTS.USER.NOTIFICATIONS);
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Record<string, boolean>): Promise<void> {
    await apiClient.put(API_ENDPOINTS.USER.NOTIFICATIONS, settings);
  },

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<{ secret: string; qrCode: string }> {
    return apiClient.post(API_ENDPOINTS.USER.TWO_FACTOR);
  },

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(code: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.TWO_FACTOR, {
      params: { code },
    });
  },
};
