// Incident service - handles incident operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Incident, IncidentFilters } from '@/types/models/Incident';
import type { CreateIncidentRequest, UpdateIncidentRequest, PaginatedResponse, PaginationParams } from '@/types/api.types';

export const incidentService = {
  /**
   * Get all incidents with optional filters
   */
  async getIncidents(
    filters?: IncidentFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Incident>> {
    return apiClient.get<PaginatedResponse<Incident>>(API_ENDPOINTS.INCIDENTS.LIST, {
      params: {
        ...filters,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        ...pagination,
      },
    });
  },

  /**
   * Get an incident by ID
   */
  async getIncidentById(id: string): Promise<Incident> {
    return apiClient.get<Incident>(API_ENDPOINTS.INCIDENTS.BY_ID(id));
  },

  /**
   * Create a new incident (report)
   */
  async createIncident(data: CreateIncidentRequest): Promise<Incident> {
    return apiClient.post<Incident>(API_ENDPOINTS.INCIDENTS.CREATE, data);
  },

  /**
   * Update an incident
   */
  async updateIncident(id: string, data: UpdateIncidentRequest): Promise<Incident> {
    return apiClient.put<Incident>(API_ENDPOINTS.INCIDENTS.UPDATE(id), data);
  },

  /**
   * Delete an incident
   */
  async deleteIncident(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INCIDENTS.DELETE(id));
  },

  /**
   * Resolve an incident
   */
  async resolveIncident(id: string, notes?: string): Promise<Incident> {
    return apiClient.patch<Incident>(API_ENDPOINTS.INCIDENTS.UPDATE(id), {
      status: 'resolved',
      notes,
      resolvedAt: new Date().toISOString(),
    });
  },

  /**
   * Get open incidents count
   */
  async getOpenIncidentsCount(): Promise<number> {
    const response = await this.getIncidents({ status: 'open' }, { pageSize: 1 });
    return response.total;
  },
};
