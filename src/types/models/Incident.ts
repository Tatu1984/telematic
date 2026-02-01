// Incident domain model

export type IncidentType =
  | "accident"
  | "breakdown"
  | "theft"
  | "vandalism"
  | "traffic_violation";

export type IncidentStatus = "open" | "investigating" | "resolved" | "closed";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity;
  title: string;
  description: string;
  vehicleId?: string;
  driverId?: string;
  organizationId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  occurredAt: Date;
  reportedAt: Date;
  resolvedAt?: Date;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentFilters {
  type?: IncidentType;
  status?: IncidentStatus;
  severity?: Severity;
  organizationId?: string;
  vehicleId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}
