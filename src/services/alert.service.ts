// Alert service - handles alert operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Alert, AlertNotification } from '@/types/models/Alert';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

export interface AlertFilters {
  type?: string;
  severity?: string;
  acknowledged?: boolean;
  vehicleId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const alertService = {
  /**
   * Get all alerts with optional filters
   */
  async getAlerts(
    filters?: AlertFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Alert>> {
    return apiClient.get<PaginatedResponse<Alert>>(API_ENDPOINTS.ALERTS.LIST, {
      params: {
        ...filters,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        ...pagination,
      },
    });
  },

  /**
   * Get an alert by ID
   */
  async getAlertById(id: string): Promise<Alert> {
    return apiClient.get<Alert>(API_ENDPOINTS.ALERTS.BY_ID(id));
  },

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(id: string): Promise<Alert> {
    return apiClient.post<Alert>(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id));
  },

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    const response = await this.getAlerts({ acknowledged: false });
    return response.data;
  },

  /**
   * Get active alerts count
   */
  async getActiveAlertsCount(): Promise<number> {
    const response = await this.getAlerts({ acknowledged: false }, { pageSize: 1 });
    return response.total;
  },

  /**
   * Get recent alert notifications (for UI display)
   */
  async getRecentNotifications(limit = 10): Promise<AlertNotification[]> {
    const response = await this.getAlerts(undefined, { pageSize: limit });
    return response.data.map((alert) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.createdAt,
      vehicleId: alert.vehicleId,
      driverId: alert.driverId,
    }));
  },
};
