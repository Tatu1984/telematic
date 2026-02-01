// Geofence domain model

export type GeofenceType = "circle" | "polygon";

export interface CircleGeofence {
  lat: number;
  lng: number;
  radius: number; // in meters
}

export interface PolygonGeofence {
  points: Array<{ lat: number; lng: number }>;
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  coordinates: CircleGeofence | PolygonGeofence;
  organizationId: string;
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  vehicleId: string;
  driverId?: string;
  eventType: "entry" | "exit";
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
}
