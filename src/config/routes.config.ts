// Route definitions - centralized route management

export const ROUTES = {
  // Public/Marketing
  HOME: '/',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',

  // Dashboard
  DASHBOARD: '/dashboard',
  TRACKING: '/tracking',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  ELD: '/eld',
  ELD_DRIVER: (driverId: string) => `/eld/driver/${driverId}`,
  GEOFENCES: '/geofences',
  INCIDENTS: '/incidents',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',

  // Admin
  ADMIN: '/admin',
} as const;

// API Routes
export const API_ROUTES = {
  // Auth
  AUTH: {
    SESSION: '/api/auth/session',
    SIGNIN: '/api/auth/signin',
    SIGNOUT: '/api/auth/signout',
    LOGOUT: '/api/auth/logout',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Vehicles
  VEHICLES: {
    LIST: '/api/vehicles',
    BY_ID: (id: string) => `/api/vehicles/${id}`,
  },

  // Drivers
  DRIVERS: {
    LIST: '/api/drivers',
    BY_ID: (id: string) => `/api/drivers/${id}`,
  },

  // Tracking
  TRACKING: {
    LIST: '/api/tracking',
  },

  // ELD
  ELD: {
    LIST: '/api/eld',
    STATUS: '/api/eld/status',
    CERTIFY: '/api/eld/certify',
  },

  // Geofences
  GEOFENCES: {
    LIST: '/api/geofences',
    BY_ID: (id: string) => `/api/geofences/${id}`,
  },

  // Incidents
  INCIDENTS: {
    LIST: '/api/incidents',
    BY_ID: (id: string) => `/api/incidents/${id}`,
  },

  // Alerts
  ALERTS: {
    LIST: '/api/alerts',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/api/analytics',
  },

  // Trips
  TRIPS: {
    LIST: '/api/trips',
  },

  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
    ORGANIZATIONS: '/api/admin/organizations',
    ORGANIZATION_BY_ID: (id: string) => `/api/admin/organizations/${id}`,
  },

  // Settings
  SETTINGS: {
    PROFILE: '/api/settings/profile',
    PASSWORD: '/api/settings/password',
    PREFERENCES: '/api/settings/preferences',
    NOTIFICATIONS: '/api/settings/notifications',
    TWO_FACTOR: '/api/settings/two-factor',
  },

  // Utility
  HEALTH: '/api/health',
  SEED: '/api/seed',
  SIMULATOR: '/api/simulator',
  CSRF: '/api/csrf',
} as const;

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.TRACKING,
  ROUTES.VEHICLES,
  ROUTES.DRIVERS,
  ROUTES.ELD,
  ROUTES.GEOFENCES,
  ROUTES.INCIDENTS,
  ROUTES.ANALYTICS,
  ROUTES.SETTINGS,
  ROUTES.ADMIN,
] as const;

// Admin-only routes
export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
] as const;
