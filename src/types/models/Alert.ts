// Alert domain model
import type { Severity } from './Incident';

export type AlertType =
  | "geofence"
  | "speeding"
  | "maintenance"
  | "eld_violation"
  | "safety"
  | "system";

export type SafetyEventType =
  | "harsh_braking"
  | "harsh_acceleration"
  | "speeding"
  | "distraction"
  | "fatigue"
  | "lane_departure"
  | "collision_warning";

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  vehicleId?: string;
  driverId?: string;
  organizationId: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
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

export interface SafetyEvent {
  id: string;
  type: SafetyEventType;
  severity: Severity;
  vehicleId: string;
  driverId?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  value?: number; // e.g., speed for speeding, g-force for harsh braking
  threshold?: number;
  timestamp: Date;
}
