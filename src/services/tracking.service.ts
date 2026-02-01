// Tracking service - handles real-time vehicle tracking
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { TrackingData } from '@/types/models/Telemetry';
import type { VehicleUpdate } from '@/types/models/Vehicle';

export const trackingService = {
  /**
   * Get current tracking data for all vehicles
   */
  async getTrackingData(): Promise<VehicleUpdate[]> {
    return apiClient.get<VehicleUpdate[]>(API_ENDPOINTS.TRACKING.LIST);
  },

  /**
   * Get tracking history for a vehicle
   */
  async getVehicleTrackingHistory(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrackingData[]> {
    return apiClient.get<TrackingData[]>(`${API_ENDPOINTS.TRACKING.LIST}/${vehicleId}/history`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  },

  /**
   * Get live tracking updates (for real-time display)
   */
  async getLiveTracking(): Promise<VehicleUpdate[]> {
    return apiClient.get<VehicleUpdate[]>(API_ENDPOINTS.TRACKING.LIVE);
  },
};
