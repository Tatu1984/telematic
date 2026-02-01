// Trip service - handles trip operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { Trip, TripFilters } from '@/types/models/Trip';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

export const tripService = {
  /**
   * Get all trips with optional filters
   */
  async getTrips(
    filters?: TripFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Trip>> {
    return apiClient.get<PaginatedResponse<Trip>>(API_ENDPOINTS.TRIPS.LIST, {
      params: {
        ...filters,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
        ...pagination,
      },
    });
  },

  /**
   * Get a trip by ID
   */
  async getTripById(id: string): Promise<Trip> {
    return apiClient.get<Trip>(API_ENDPOINTS.TRIPS.BY_ID(id));
  },

  /**
   * Get trips for a vehicle
   */
  async getVehicleTrips(
    vehicleId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Trip>> {
    return this.getTrips({ vehicleId }, pagination);
  },

  /**
   * Get trips for a driver
   */
  async getDriverTrips(
    driverId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Trip>> {
    return this.getTrips({ driverId }, pagination);
  },

  /**
   * Get today's trips
   */
  async getTodaysTrips(): Promise<Trip[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await this.getTrips({
      startDate: today,
      endDate: tomorrow,
    });
    return response.data;
  },

  /**
   * Get active (in-progress) trips
   */
  async getActiveTrips(): Promise<Trip[]> {
    const response = await this.getTrips({ status: 'in_progress' });
    return response.data;
  },
};
