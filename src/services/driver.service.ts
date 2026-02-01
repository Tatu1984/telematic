// Driver service - handles driver operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Driver, DriverFilters, DriverStats } from '@/types/models/Driver';
import type { CreateDriverRequest, UpdateDriverRequest, PaginatedResponse, PaginationParams } from '@/types/api.types';

export const driverService = {
  /**
   * Get all drivers with optional filters and pagination
   */
  async getDrivers(
    filters?: DriverFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Driver>> {
    return apiClient.get<PaginatedResponse<Driver>>(API_ENDPOINTS.DRIVERS.LIST, {
      params: {
        ...filters,
        ...pagination,
      },
    });
  },

  /**
   * Get a driver by ID
   */
  async getDriverById(id: string): Promise<Driver> {
    return apiClient.get<Driver>(API_ENDPOINTS.DRIVERS.BY_ID(id));
  },

  /**
   * Create a new driver
   */
  async createDriver(data: CreateDriverRequest): Promise<Driver> {
    return apiClient.post<Driver>(API_ENDPOINTS.DRIVERS.CREATE, data);
  },

  /**
   * Update a driver
   */
  async updateDriver(id: string, data: UpdateDriverRequest): Promise<Driver> {
    return apiClient.put<Driver>(API_ENDPOINTS.DRIVERS.UPDATE(id), data);
  },

  /**
   * Delete a driver
   */
  async deleteDriver(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DRIVERS.DELETE(id));
  },

  /**
   * Get driver statistics
   */
  async getDriverStats(id: string): Promise<DriverStats> {
    return apiClient.get<DriverStats>(`${API_ENDPOINTS.DRIVERS.BY_ID(id)}/stats`);
  },

  /**
   * Get active drivers
   */
  async getActiveDrivers(): Promise<Driver[]> {
    const response = await this.getDrivers({ status: 'driving' });
    return response.data;
  },
};
