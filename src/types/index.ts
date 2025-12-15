// User Roles
export type SaaSRole =
  | "saas_admin"
  | "saas_subscriber_manager"
  | "saas_support"
  | "saas_developer";

export type CompanyRole =
  | "company_admin"
  | "fleet_manager"
  | "driver"
  | "company_support";

export type UserRole = SaaSRole | CompanyRole;

// ELD Status types per DOT regulations
export type ELDStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

// Driver status
export type DriverStatus =
  | "available"
  | "driving"
  | "off_duty"
  | "sleeper_berth";

// Vehicle types
export type VehicleType = "truck" | "van" | "car" | "trailer";
export type FuelType = "diesel" | "gasoline" | "electric" | "hybrid";
export type VehicleStatus = "active" | "inactive" | "maintenance" | "out_of_service";

// Safety event types
export type SafetyEventType =
  | "harsh_braking"
  | "harsh_acceleration"
  | "speeding"
  | "distraction"
  | "fatigue"
  | "lane_departure"
  | "collision_warning";

export type Severity = "low" | "medium" | "high" | "critical";

// Incident types
export type IncidentType =
  | "accident"
  | "breakdown"
  | "theft"
  | "vandalism"
  | "traffic_violation";

export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

// Alert types
export type AlertType =
  | "geofence"
  | "speeding"
  | "maintenance"
  | "eld_violation"
  | "safety"
  | "system";

// Geofence types
export type GeofenceType = "circle" | "polygon";

export interface CircleGeofence {
  lat: number;
  lng: number;
  radius: number; // in meters
}

export interface PolygonGeofence {
  points: Array<{ lat: number; lng: number }>;
}

// GPS Location
export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: Date;
}

// Vehicle Telemetry Data
export interface TelemetryData {
  engineRpm?: number;
  fuelLevel?: number;
  coolantTemp?: number;
  oilPressure?: number;
  batteryVoltage?: number;
  throttlePosition?: number;
  engineLoad?: number;
  intakeAirTemp?: number;
  massAirflow?: number;
  timestamp: Date;
}

// ELD Hours of Service calculation
export interface HOSStatus {
  driving: number;       // minutes driven in current cycle
  onDuty: number;        // minutes on duty not driving
  remaining: {
    driving: number;     // remaining driving hours (11 hour rule)
    onDuty: number;      // remaining on-duty hours (14 hour rule)
    cycle: number;       // remaining in 70-hour/8-day cycle
  };
  violations: HOSViolation[];
  breakRequired: boolean;
  nextBreakDue?: Date;
}

export interface HOSViolation {
  type: "driving_limit" | "duty_limit" | "break_required" | "cycle_limit";
  description: string;
  timestamp: Date;
  duration?: number;
}

// Dashboard Statistics
export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenanceVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTripsToday: number;
  totalMilesToday: number;
  fuelUsedToday: number;
  activeAlerts: number;
  safetyScore: number;
}

export interface DriverStats {
  totalTrips: number;
  totalMiles: number;
  safetyScore: number;
  safetyEvents: number;
  hosStatus: HOSStatus;
  currentStatus: DriverStatus;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

// Real-time data types for WebSocket
export interface VehicleUpdate {
  vehicleId: string;
  location: GPSLocation;
  telemetry?: TelemetryData;
  driverId?: string;
  status: VehicleStatus;
}

export interface AlertNotification {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  timestamp: Date;
  vehicleId?: string;
  driverId?: string;
}
