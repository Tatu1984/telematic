// Vehicle service - handles vehicle operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Vehicle, VehicleFilters } from '@/types/models/Vehicle';
import type { CreateVehicleRequest, UpdateVehicleRequest, PaginatedResponse, PaginationParams } from '@/types/api.types';

export const vehicleService = {
  /**
   * Get all vehicles with optional filters and pagination
   */
  async getVehicles(
    filters?: VehicleFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Vehicle>> {
    return apiClient.get<PaginatedResponse<Vehicle>>(API_ENDPOINTS.VEHICLES.LIST, {
      params: {
        ...filters,
        ...pagination,
      },
    });
  },

  /**
   * Get a vehicle by ID
   */
  async getVehicleById(id: string): Promise<Vehicle> {
    return apiClient.get<Vehicle>(API_ENDPOINTS.VEHICLES.BY_ID(id));
  },

  /**
   * Create a new vehicle
   */
  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    return apiClient.post<Vehicle>(API_ENDPOINTS.VEHICLES.CREATE, data);
  },

  /**
   * Update a vehicle
   */
  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<Vehicle> {
    return apiClient.put<Vehicle>(API_ENDPOINTS.VEHICLES.UPDATE(id), data);
  },

  /**
   * Delete a vehicle
   */
  async deleteVehicle(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.VEHICLES.DELETE(id));
  },

  /**
   * Get vehicles currently being tracked (active)
   */
  async getActiveVehicles(): Promise<Vehicle[]> {
    const response = await this.getVehicles({ status: 'active' });
    return response.data;
  },
};
