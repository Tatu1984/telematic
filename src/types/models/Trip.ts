// Trip domain model
import type { GPSLocation } from './Telemetry';

export type TripStatus = "planned" | "in_progress" | "completed" | "cancelled";

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  organizationId: string;
  status: TripStatus;
  startLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startTime: Date;
  endTime?: Date;
  distance?: number; // in miles
  duration?: number; // in minutes
  fuelUsed?: number; // in gallons
  route?: GPSLocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TripFilters {
  vehicleId?: string;
  driverId?: string;
  organizationId?: string;
  status?: TripStatus;
  startDate?: Date;
  endDate?: Date;
}
