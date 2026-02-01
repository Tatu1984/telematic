// Telemetry and GPS domain models

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: Date;
}

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

export interface TrackingData {
  vehicleId: string;
  driverId?: string;
  location: GPSLocation;
  telemetry?: TelemetryData;
  status: string;
  timestamp: Date;
}
