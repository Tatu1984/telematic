// Analytics service - handles analytics and reporting
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { FleetStats, DashboardStats, AnalyticsReport } from '@/types/models/Analytics';

export const analyticsService = {
  /**
   * Get fleet statistics
   */
  async getFleetStats(): Promise<FleetStats> {
    return apiClient.get<FleetStats>(API_ENDPOINTS.ANALYTICS.FLEET);
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>(API_ENDPOINTS.ANALYTICS.DASHBOARD);
  },

  /**
   * Get analytics report for a period
   */
  async getReport(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    return apiClient.get<AnalyticsReport>(API_ENDPOINTS.ANALYTICS.DASHBOARD, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  },

  /**
   * Get driver analytics
   */
  async getDriverAnalytics(driverId: string, period?: { start: Date; end: Date }): Promise<AnalyticsReport> {
    return apiClient.get<AnalyticsReport>(API_ENDPOINTS.ANALYTICS.DRIVER(driverId), {
      params: period
        ? {
            startDate: period.start.toISOString(),
            endDate: period.end.toISOString(),
          }
        : undefined,
    });
  },

  /**
   * Get vehicle analytics
   */
  async getVehicleAnalytics(vehicleId: string, period?: { start: Date; end: Date }): Promise<AnalyticsReport> {
    return apiClient.get<AnalyticsReport>(API_ENDPOINTS.ANALYTICS.VEHICLE(vehicleId), {
      params: period
        ? {
            startDate: period.start.toISOString(),
            endDate: period.end.toISOString(),
          }
        : undefined,
    });
  },
};
