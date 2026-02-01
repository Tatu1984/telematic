"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Input,
} from "@/components/ui";
import {
  Search,
  Truck,
  Navigation,
  Gauge,
  User,
  RefreshCw,
} from "lucide-react";

// Dynamic import for Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  timestamp: Date;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  status: string;
  currentDriver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  iotDevice?: {
    status: string;
    type: string;
  } | null;
  locations: Location[];
}

interface Geofence {
  id: string;
  name: string;
  type: string;
  coordinates: string;
  color: string;
}

interface TrackingDashboardProps {
  vehicles: Vehicle[];
  geofences: Geofence[];
}

export function TrackingDashboard({ vehicles, geofences }: TrackingDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.make.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.currentDriver?.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      v.currentDriver?.user.lastName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedVehicleData = selectedVehicle
    ? vehicles.find((v) => v.id === selectedVehicle)
    : null;

  const vehicleMarkers = vehicles
    .filter((v) => v.locations.length > 0)
    .map((v) => ({
      id: v.id,
      lat: v.locations[0].latitude,
      lng: v.locations[0].longitude,
      speed: v.locations[0].speed || 0,
      heading: v.locations[0].heading || 0,
      label: v.licensePlate,
      driver: v.currentDriver
        ? `${v.currentDriver.user.firstName} ${v.currentDriver.user.lastName}`
        : "Unassigned",
      status: v.iotDevice?.status || "offline",
    }));

  const parsedGeofences = geofences.map((g) => ({
    id: g.id,
    name: g.name,
    type: g.type,
    coordinates: JSON.parse(g.coordinates),
    color: g.color,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Vehicle List Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered" className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <CardHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Active Vehicles ({filteredVehicles.length})</span>
              <span className="text-xs text-gray-400 font-normal">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y dark:divide-gray-700">
              {filteredVehicles.map((vehicle) => {
                const location = vehicle.locations[0];
                const isSelected = selectedVehicle === vehicle.id;
                const isOnline = vehicle.iotDevice?.status === "online";

                return (
                  <button
                    key={vehicle.id}
                    onClick={() =>
                      setSelectedVehicle(isSelected ? null : vehicle.id)
                    }
                    className={`w-full p-4 text-left transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isOnline
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Truck
                          className={`w-5 h-5 ${
                            isOnline ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {vehicle.licensePlate}
                          </p>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {vehicle.make} {vehicle.model}
                        </p>
                        {vehicle.currentDriver && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {vehicle.currentDriver.user.firstName}{" "}
                            {vehicle.currentDriver.user.lastName}
                          </p>
                        )}
                        {location && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {location.speed?.toFixed(0) || 0} mph
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              {location.heading?.toFixed(0) || 0}°
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredVehicles.length === 0 && (
                <div className="p-8 text-center">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No vehicles found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Area */}
      <div className="lg:col-span-3 space-y-4">
        <Card variant="bordered" className="overflow-hidden">
          <MapComponent
            vehicles={vehicleMarkers}
            geofences={parsedGeofences}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </Card>

        {/* Selected Vehicle Details */}
        {selectedVehicleData && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                {selectedVehicleData.licensePlate} - Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicleData.make} {selectedVehicleData.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicleData.currentDriver
                      ? `${selectedVehicleData.currentDriver.user.firstName} ${selectedVehicleData.currentDriver.user.lastName}`
                      : "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Device Status</p>
                  <Badge
                    variant={
                      selectedVehicleData.iotDevice?.status === "online"
                        ? "success"
                        : "default"
                    }
                  >
                    {selectedVehicleData.iotDevice?.status || "No device"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Speed</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedVehicleData.locations[0]?.speed?.toFixed(0) || 0} mph
                  </p>
                </div>
                {selectedVehicleData.locations[0] && (
                  <>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Coordinates</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {selectedVehicleData.locations[0].latitude.toFixed(6)},{" "}
                        {selectedVehicleData.locations[0].longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(
                          selectedVehicleData.locations[0].timestamp
                        ).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
