"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ParsedGeofence {
  id: string;
  name: string;
  type: string;
  color: string;
  status: string;
  parsedCoordinates: { lat: number; lng: number; radius?: number } | { lat: number; lng: number }[];
}

interface GeofenceMapProps {
  geofences: ParsedGeofence[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function GeofenceMap({ geofences, selectedId, onSelect }: GeofenceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("geofence-map", {
        center: [41.8781, -87.6298],
        zoom: 11,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing layers
    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current.clear();

    // Add geofence layers
    geofences.forEach((geofence) => {
      let layer: L.Layer;
      const isSelected = geofence.id === selectedId;
      const opacity = geofence.status === "active" ? 0.3 : 0.1;
      const weight = isSelected ? 4 : 2;

      if (geofence.type === "circle" && "radius" in geofence.parsedCoordinates) {
        const coords = geofence.parsedCoordinates as { lat: number; lng: number; radius: number };
        layer = L.circle([coords.lat, coords.lng], {
          radius: coords.radius,
          color: isSelected ? "#3B82F6" : geofence.color,
          fillColor: geofence.color,
          fillOpacity: opacity,
          weight,
        });
      } else if (Array.isArray(geofence.parsedCoordinates)) {
        const points = geofence.parsedCoordinates as { lat: number; lng: number }[];
        layer = L.polygon(
          points.map((p) => [p.lat, p.lng]),
          {
            color: isSelected ? "#3B82F6" : geofence.color,
            fillColor: geofence.color,
            fillOpacity: opacity,
            weight,
          }
        );
      } else {
        return;
      }

      layer.bindPopup(`
        <div class="p-2">
          <div class="font-bold">${geofence.name}</div>
          <div class="text-sm text-gray-500">Type: ${geofence.type}</div>
          <div class="text-sm text-gray-500">Status: ${geofence.status}</div>
        </div>
      `);

      layer.on("click", () => {
        onSelect(geofence.id === selectedId ? null : geofence.id);
      });

      layer.addTo(mapRef.current!);
      layersRef.current.set(geofence.id, layer);
    });

    // Fit bounds to show all geofences
    if (geofences.length > 0) {
      const bounds: L.LatLngExpression[] = [];
      geofences.forEach((geofence) => {
        if (geofence.type === "circle" && "radius" in geofence.parsedCoordinates) {
          const coords = geofence.parsedCoordinates as { lat: number; lng: number; radius: number };
          bounds.push([coords.lat, coords.lng]);
        } else if (Array.isArray(geofence.parsedCoordinates)) {
          geofence.parsedCoordinates.forEach((p) => {
            bounds.push([p.lat, p.lng]);
          });
        }
      });
      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    }
  }, [geofences, selectedId, onSelect]);

  // Focus on selected geofence
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;

    const geofence = geofences.find((g) => g.id === selectedId);
    if (!geofence) return;

    if (geofence.type === "circle" && "radius" in geofence.parsedCoordinates) {
      const coords = geofence.parsedCoordinates as { lat: number; lng: number; radius: number };
      mapRef.current.setView([coords.lat, coords.lng], 13);
    } else if (Array.isArray(geofence.parsedCoordinates) && geofence.parsedCoordinates.length > 0) {
      const bounds = L.latLngBounds(
        geofence.parsedCoordinates.map((p) => [p.lat, p.lng] as L.LatLngTuple)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedId, geofences]);

  return <div id="geofence-map" className="h-[500px] w-full rounded-lg z-0" />;
}
