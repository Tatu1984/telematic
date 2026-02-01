// ELD service - handles Electronic Logging Device operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { ELDLog, HOSStatus, ELDCertification } from '@/types/models/ELD';

export const eldService = {
  /**
   * Get ELD logs for a driver
   */
  async getDriverLogs(driverId: string, date?: string): Promise<ELDLog[]> {
    return apiClient.get<ELDLog[]>(API_ENDPOINTS.ELD.BY_DRIVER(driverId), {
      params: date ? { date } : undefined,
    });
  },

  /**
   * Get all ELD logs (for admin/fleet manager)
   */
  async getAllLogs(date?: string): Promise<ELDLog[]> {
    return apiClient.get<ELDLog[]>(API_ENDPOINTS.ELD.LIST, {
      params: date ? { date } : undefined,
    });
  },

  /**
   * Get HOS status for a driver
   */
  async getDriverHOSStatus(driverId: string): Promise<HOSStatus> {
    return apiClient.get<HOSStatus>(`${API_ENDPOINTS.ELD.STATUS}/${driverId}`);
  },

  /**
   * Get current ELD status for all drivers
   */
  async getAllDriversStatus(): Promise<Array<{ driverId: string; status: HOSStatus }>> {
    return apiClient.get(API_ENDPOINTS.ELD.STATUS);
  },

  /**
   * Update ELD status (e.g., driver changing duty status)
   */
  async updateStatus(driverId: string, status: string, notes?: string): Promise<ELDLog> {
    return apiClient.post<ELDLog>(API_ENDPOINTS.ELD.STATUS, {
      driverId,
      status,
      notes,
    });
  },

  /**
   * Certify ELD logs for a day
   */
  async certifyLogs(certification: ELDCertification): Promise<void> {
    await apiClient.post(API_ENDPOINTS.ELD.CERTIFY, certification);
  },

  /**
   * Check if logs are certified for a date
   */
  async isCertified(driverId: string, date: string): Promise<boolean> {
    const result = await apiClient.get<{ certified: boolean }>(
      `${API_ENDPOINTS.ELD.CERTIFY}/${driverId}`,
      { params: { date } }
    );
    return result.certified;
  },
};
