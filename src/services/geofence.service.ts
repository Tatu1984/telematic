// Geofence service - handles geofence operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Geofence, GeofenceEvent } from '@/types/models/Geofence';
import type { CreateGeofenceRequest, PaginatedResponse, PaginationParams } from '@/types/api.types';

export const geofenceService = {
  /**
   * Get all geofences
   */
  async getGeofences(pagination?: PaginationParams): Promise<PaginatedResponse<Geofence>> {
    return apiClient.get<PaginatedResponse<Geofence>>(API_ENDPOINTS.GEOFENCES.LIST, {
      params: pagination ? { ...pagination } : undefined,
    });
  },

  /**
   * Get a geofence by ID
   */
  async getGeofenceById(id: string): Promise<Geofence> {
    return apiClient.get<Geofence>(API_ENDPOINTS.GEOFENCES.BY_ID(id));
  },

  /**
   * Create a new geofence
   */
  async createGeofence(data: CreateGeofenceRequest): Promise<Geofence> {
    return apiClient.post<Geofence>(API_ENDPOINTS.GEOFENCES.CREATE, data);
  },

  /**
   * Update a geofence
   */
  async updateGeofence(id: string, data: Partial<CreateGeofenceRequest>): Promise<Geofence> {
    return apiClient.put<Geofence>(API_ENDPOINTS.GEOFENCES.UPDATE(id), data);
  },

  /**
   * Delete a geofence
   */
  async deleteGeofence(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.GEOFENCES.DELETE(id));
  },

  /**
   * Get geofence events (entry/exit)
   */
  async getGeofenceEvents(
    geofenceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GeofenceEvent[]> {
    return apiClient.get<GeofenceEvent[]>(`${API_ENDPOINTS.GEOFENCES.BY_ID(geofenceId)}/events`, {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
  },

  /**
   * Toggle geofence active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<Geofence> {
    return apiClient.patch<Geofence>(API_ENDPOINTS.GEOFENCES.UPDATE(id), { isActive });
  },
};
