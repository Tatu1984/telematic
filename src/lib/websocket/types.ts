// WebSocket types
import type { VehicleUpdate } from '@/types/models/Vehicle';
import type { AlertNotification } from '@/types/models/Alert';

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface WebSocketEvents {
  'connect': () => void;
  'disconnect': () => void;
  'error': (error: Error) => void;
  'vehicle:update': (data: VehicleUpdate) => void;
  'alert:new': (data: AlertNotification) => void;
  'eld:status': (data: { driverId: string; status: string }) => void;
  'geofence:event': (data: { geofenceId: string; vehicleId: string; eventType: 'entry' | 'exit' }) => void;
}

export type WebSocketEventName = keyof WebSocketEvents;
