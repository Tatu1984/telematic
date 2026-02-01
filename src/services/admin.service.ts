// Admin service - handles admin operations
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type { User, Organization } from '@/types/models/User';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

export interface UserFilters {
  role?: string;
  status?: string;
  organizationId?: string;
  search?: string;
}

export interface OrganizationFilters {
  status?: string;
  search?: string;
}

export const adminService = {
  // User Management
  /**
   * Get all users (admin only)
   */
  async getUsers(
    filters?: UserFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.ADMIN.USERS.LIST, {
      params: { ...filters, ...pagination },
    });
  },

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.ADMIN.USERS.BY_ID(id));
  },

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId?: string;
    password: string;
  }): Promise<User> {
    return apiClient.post<User>(API_ENDPOINTS.ADMIN.USERS.CREATE, data);
  },

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return apiClient.put<User>(API_ENDPOINTS.ADMIN.USERS.UPDATE(id), data);
  },

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.USERS.DELETE(id));
  },

  // Organization Management
  /**
   * Get all organizations
   */
  async getOrganizations(
    filters?: OrganizationFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Organization>> {
    return apiClient.get<PaginatedResponse<Organization>>(API_ENDPOINTS.ADMIN.ORGANIZATIONS.LIST, {
      params: { ...filters, ...pagination },
    });
  },

  /**
   * Get an organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    return apiClient.get<Organization>(API_ENDPOINTS.ADMIN.ORGANIZATIONS.BY_ID(id));
  },

  /**
   * Create a new organization
   */
  async createOrganization(data: {
    name: string;
    status?: string;
    subscriptionTier?: string;
  }): Promise<Organization> {
    return apiClient.post<Organization>(API_ENDPOINTS.ADMIN.ORGANIZATIONS.CREATE, data);
  },

  /**
   * Update an organization
   */
  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    return apiClient.put<Organization>(API_ENDPOINTS.ADMIN.ORGANIZATIONS.UPDATE(id), data);
  },

  /**
   * Delete an organization
   */
  async deleteOrganization(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.ORGANIZATIONS.DELETE(id));
  },
};
