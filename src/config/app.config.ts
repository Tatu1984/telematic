// App-wide configuration

export const APP_CONFIG = {
  name: 'FleetTrack Pro',
  description: 'Telematics Platform for Fleet Management',
  version: '1.0.0',

  // Session
  session: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    updateAge: 60 * 60, // 1 hour - how often to update session
  },

  // Pagination
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  // Date/Time
  dateFormat: 'MMM dd, yyyy',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'MMM dd, yyyy HH:mm',

  // Map
  map: {
    defaultCenter: { lat: 39.8283, lng: -98.5795 }, // Center of USA
    defaultZoom: 4,
  },

  // ELD
  eld: {
    maxDrivingHours: 11,
    maxOnDutyHours: 14,
    requiredBreakMinutes: 30,
    breakRequiredAfterHours: 8,
  },

  // Alerts
  alerts: {
    speedingThreshold: 5, // mph over limit
    idleTimeThreshold: 15, // minutes
    hardBrakeThreshold: 0.4, // g-force
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
