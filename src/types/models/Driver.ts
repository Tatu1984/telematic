// Driver domain model
import type { HOSStatus } from './ELD';

export type DriverStatus =
  | "available"
  | "driving"
  | "off_duty"
  | "sleeper_berth";

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  status: DriverStatus;
  organizationId: string;
  currentVehicleId?: string;
  eldDeviceId?: string;
  homeTerminal?: string;
  hireDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverStats {
  totalTrips: number;
  totalMiles: number;
  safetyScore: number;
  safetyEvents: number;
  hosStatus: HOSStatus;
  currentStatus: DriverStatus;
}

export interface DriverFilters {
  status?: DriverStatus;
  organizationId?: string;
  search?: string;
}
