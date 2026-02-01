// API Endpoints - Centralized endpoint definitions
// This file maps to the backend API structure
// When migrating to a real backend, update these paths

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    SESSION: '/auth/session',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User/Profile
  USER: {
    PROFILE: '/settings/profile',
    UPDATE_PROFILE: '/settings/profile',
    CHANGE_PASSWORD: '/settings/password',
    PREFERENCES: '/settings/preferences',
    NOTIFICATIONS: '/settings/notifications',
    TWO_FACTOR: '/settings/two-factor',
  },

  // Vehicles
  VEHICLES: {
    LIST: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}`,
    CREATE: '/vehicles',
    UPDATE: (id: string) => `/vehicles/${id}`,
    DELETE: (id: string) => `/vehicles/${id}`,
  },

  // Drivers
  DRIVERS: {
    LIST: '/drivers',
    BY_ID: (id: string) => `/drivers/${id}`,
    CREATE: '/drivers',
    UPDATE: (id: string) => `/drivers/${id}`,
    DELETE: (id: string) => `/drivers/${id}`,
  },

  // Tracking
  TRACKING: {
    LIST: '/tracking',
    LIVE: '/tracking/live',
  },

  // ELD (Electronic Logging Device)
  ELD: {
    LIST: '/eld',
    STATUS: '/eld/status',
    CERTIFY: '/eld/certify',
    BY_DRIVER: (driverId: string) => `/eld/driver/${driverId}`,
  },

  // Geofences
  GEOFENCES: {
    LIST: '/geofences',
    BY_ID: (id: string) => `/geofences/${id}`,
    CREATE: '/geofences',
    UPDATE: (id: string) => `/geofences/${id}`,
    DELETE: (id: string) => `/geofences/${id}`,
  },

  // Incidents
  INCIDENTS: {
    LIST: '/incidents',
    BY_ID: (id: string) => `/incidents/${id}`,
    CREATE: '/incidents',
    UPDATE: (id: string) => `/incidents/${id}`,
    DELETE: (id: string) => `/incidents/${id}`,
  },

  // Alerts
  ALERTS: {
    LIST: '/alerts',
    BY_ID: (id: string) => `/alerts/${id}`,
    ACKNOWLEDGE: (id: string) => `/alerts/${id}/acknowledge`,
  },

  // Trips
  TRIPS: {
    LIST: '/trips',
    BY_ID: (id: string) => `/trips/${id}`,
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics',
    FLEET: '/analytics/fleet',
    DRIVER: (driverId: string) => `/analytics/driver/${driverId}`,
    VEHICLE: (vehicleId: string) => `/analytics/vehicle/${vehicleId}`,
  },

  // Admin
  ADMIN: {
    USERS: {
      LIST: '/admin/users',
      BY_ID: (id: string) => `/admin/users/${id}`,
      CREATE: '/admin/users',
      UPDATE: (id: string) => `/admin/users/${id}`,
      DELETE: (id: string) => `/admin/users/${id}`,
    },
    ORGANIZATIONS: {
      LIST: '/admin/organizations',
      BY_ID: (id: string) => `/admin/organizations/${id}`,
      CREATE: '/admin/organizations',
      UPDATE: (id: string) => `/admin/organizations/${id}`,
      DELETE: (id: string) => `/admin/organizations/${id}`,
    },
  },

  // Utility
  HEALTH: '/health',
  SIMULATOR: '/simulator',
} as const;
