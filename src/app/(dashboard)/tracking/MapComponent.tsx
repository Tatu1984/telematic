"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Dynamic import Leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

interface VehicleMarker {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  label: string;
  driver: string;
  status: string;
}

interface GeofenceData {
  id: string;
  name: string;
  type: string;
  coordinates: { lat: number; lng: number; radius?: number } | { lat: number; lng: number }[];
  color: string;
}

interface MapComponentProps {
  vehicles: VehicleMarker[];
  geofences: GeofenceData[];
  selectedVehicle: string | null;
  onVehicleSelect: (id: string | null) => void;
}

export default function MapComponent({
  vehicles,
  geofences,
  selectedVehicle,
  onVehicleSelect,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const geofencesRef = useRef<L.Layer[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined" || !L || !mapContainerRef.current) return;

    // Initialize map only if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [41.8781, -87.6298], // Chicago - configurable via env in production
        zoom: 10,
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      setIsMapReady(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current || !L || !isMapReady) return;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    // Add new markers
    vehicles.forEach((vehicle) => {
      const isOnline = vehicle.status === "online";
      const isSelected = vehicle.id === selectedVehicle;

      // Use inline styles for dynamic rotation instead of Tailwind dynamic classes
      const rotationStyle = isOnline ? `transform: rotate(${vehicle.heading}deg);` : "";
      const bgColor = isOnline ? "#22c55e" : "#9ca3af"; // green-500 / gray-400
      const ringStyle = isSelected ? "box-shadow: 0 0 0 4px #60a5fa;" : "";

      // Custom icon with inline styles
      const iconHtml = `
        <div style="position: relative;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${bgColor};
            ${ringStyle}
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            ${rotationStyle}
          ">
            <svg style="width: 20px; height: 20px; color: white;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          ${
            isOnline && vehicle.speed > 0
              ? `<div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75); color: white; font-size: 10px; padding: 0 4px; border-radius: 2px; white-space: nowrap;">${vehicle.speed.toFixed(0)} mph</div>`
              : ""
          }
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="p-2 min-w-[150px]">
            <div class="font-bold text-gray-900">${vehicle.label}</div>
            <div class="text-sm text-gray-500">${vehicle.driver}</div>
            <div class="mt-2 text-sm">
              <div>Speed: ${vehicle.speed.toFixed(0)} mph</div>
              <div>Heading: ${vehicle.heading.toFixed(0)}°</div>
              <div>Status: ${vehicle.status}</div>
            </div>
          </div>
        `)
        .on("click", () => {
          onVehicleSelect(vehicle.id);
        });

      markersRef.current.set(vehicle.id, marker);
    });

    // Fit bounds if we have vehicles
    if (vehicles.length > 0) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [vehicles, selectedVehicle, onVehicleSelect]);

  // Update geofences
  useEffect(() => {
    if (!mapRef.current || !L || !isMapReady) return;

    // Remove old geofences
    geofencesRef.current.forEach((layer) => {
      layer.remove();
    });
    geofencesRef.current = [];

    // Add new geofences
    geofences.forEach((geofence) => {
      let layer: L.Layer;

      if (geofence.type === "circle" && "radius" in geofence.coordinates) {
        const coords = geofence.coordinates as { lat: number; lng: number; radius: number };
        layer = L.circle([coords.lat, coords.lng], {
          radius: coords.radius,
          color: geofence.color,
          fillColor: geofence.color,
          fillOpacity: 0.2,
          weight: 2,
        }).bindPopup(`<strong>${geofence.name}</strong>`);
      } else if (geofence.type === "polygon" && Array.isArray(geofence.coordinates)) {
        const points = geofence.coordinates as { lat: number; lng: number }[];
        layer = L.polygon(
          points.map((p) => [p.lat, p.lng]),
          {
            color: geofence.color,
            fillColor: geofence.color,
            fillOpacity: 0.2,
            weight: 2,
          }
        ).bindPopup(`<strong>${geofence.name}</strong>`);
      } else {
        return;
      }

      layer.addTo(mapRef.current!);
      geofencesRef.current.push(layer);
    });
  }, [geofences, isMapReady]);

  // Focus on selected vehicle
  useEffect(() => {
    if (!mapRef.current || !selectedVehicle || !isMapReady) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    if (vehicle) {
      mapRef.current.setView([vehicle.lat, vehicle.lng], 14);
      const marker = markersRef.current.get(vehicle.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedVehicle, vehicles, isMapReady]);

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="h-[600px] w-full rounded-lg z-0"
        aria-label="Fleet tracking map"
      />
    </>
  );
}
