// Vehicle domain model
import type { GPSLocation, TelemetryData } from './Telemetry';

export type VehicleType = "truck" | "van" | "car" | "trailer";
export type FuelType = "diesel" | "gasoline" | "electric" | "hybrid";
export type VehicleStatus = "active" | "inactive" | "maintenance" | "out_of_service";

export interface Vehicle {
  id: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  organizationId: string;
  currentDriverId?: string;
  lastLocation?: GPSLocation;
  lastTelemetry?: TelemetryData;
  mileage?: number;
  fuelCapacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleUpdate {
  vehicleId: string;
  location: GPSLocation;
  telemetry?: TelemetryData;
  driverId?: string;
  status: VehicleStatus;
}

export interface VehicleFilters {
  status?: VehicleStatus;
  type?: VehicleType;
  organizationId?: string;
  search?: string;
}
