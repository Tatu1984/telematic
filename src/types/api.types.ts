// API request/response types

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token?: string;
}

// Settings
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Vehicle
export interface CreateVehicleRequest {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: string;
  fuelType: string;
}

export interface UpdateVehicleRequest {
  licensePlate?: string;
  status?: string;
  currentDriverId?: string;
}

// Driver
export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
}

export interface UpdateDriverRequest {
  phone?: string;
  status?: string;
  currentVehicleId?: string;
}

// Geofence
export interface CreateGeofenceRequest {
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  coordinates: {
    lat?: number;
    lng?: number;
    radius?: number;
    points?: Array<{ lat: number; lng: number }>;
  };
  alertOnEntry?: boolean;
  alertOnExit?: boolean;
}

// Incident
export interface CreateIncidentRequest {
  type: string;
  severity: string;
  title: string;
  description: string;
  vehicleId?: string;
  driverId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface UpdateIncidentRequest {
  status?: string;
  severity?: string;
  notes?: string;
  resolvedAt?: string;
}
