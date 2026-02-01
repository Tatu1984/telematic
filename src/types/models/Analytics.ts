// Analytics domain model

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

export interface DashboardStats {
  fleet: FleetStats;
  recentAlerts: number;
  pendingIncidents: number;
  hosViolationsToday: number;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface AnalyticsReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalTrips: number;
    totalMiles: number;
    totalFuelUsed: number;
    averageMpg: number;
    safetyScore: number;
    totalIncidents: number;
    hosViolations: number;
  };
  trends: {
    miles: TrendData[];
    fuel: TrendData[];
    safety: TrendData[];
  };
}
