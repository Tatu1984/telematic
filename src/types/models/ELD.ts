// ELD (Electronic Logging Device) domain model

// ELD Status types per DOT regulations
export type ELDStatus =
  | "off_duty"
  | "sleeper_berth"
  | "driving"
  | "on_duty_not_driving";

export interface ELDLog {
  id: string;
  driverId: string;
  vehicleId?: string;
  status: ELDStatus;
  startTime: Date;
  endTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  odometer?: number;
  engineHours?: number;
  notes?: string;
  certified: boolean;
  certifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface ELDCertification {
  driverId: string;
  date: string; // YYYY-MM-DD format
  certified: boolean;
  certifiedAt?: Date;
  signature?: string;
}
