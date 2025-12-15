"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
} from "@/components/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Search,
  AlertTriangle,
  Plus,
  MapPin,
  Calendar,
  Truck,
  User,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  latitude: number;
  longitude: number;
  location?: string | null;
  status: string;
  reportedAt: Date;
  resolvedAt?: Date | null;
  resolution?: string | null;
  vehicle?: {
    licensePlate: string;
    make: string;
    model: string;
  } | null;
  driver?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  videos: {
    id: string;
    filename: string;
    status: string;
  }[];
}

interface IncidentsListProps {
  incidents: Incident[];
  userRole: string;
}

export function IncidentsList({ incidents, userRole }: IncidentsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Calculate stats
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const investigatingIncidents = incidents.filter((i) => i.status === "investigating").length;
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const criticalIncidents = incidents.filter(
    (i) => i.severity === "critical" || i.severity === "major"
  ).length;

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.description.toLowerCase().includes(search.toLowerCase()) ||
      incident.type.toLowerCase().includes(search.toLowerCase()) ||
      incident.location?.toLowerCase().includes(search.toLowerCase()) ||
      incident.vehicle?.licensePlate.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesType = typeFilter === "all" || incident.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const severityColors = {
    minor: "success",
    moderate: "warning",
    major: "danger",
    critical: "danger",
  } as const;

  const statusColors = {
    open: "danger",
    investigating: "warning",
    resolved: "success",
    closed: "default",
  } as const;

  const typeIcons = {
    accident: AlertTriangle,
    breakdown: Truck,
    theft: AlertCircle,
    vandalism: AlertCircle,
    traffic_violation: FileText,
  };

  const incidentTypes = [...new Set(incidents.map((i) => i.type))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Open Incidents"
          value={openIncidents}
          icon="alertTriangle"
          iconColor="text-red-600"
          iconBgColor="bg-red-100 dark:bg-red-900/30"
        />
        <StatsCard
          title="Under Investigation"
          value={investigatingIncidents}
          icon="clock"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatsCard
          title="Resolved"
          value={resolvedIncidents}
          icon="checkCircle"
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatsCard
          title="Critical/Major"
          value={criticalIncidents}
          icon="alertCircle"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Filters */}
      <Card variant="bordered">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {["all", "open", "investigating", "resolved", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Types</option>
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredIncidents.length === 0 ? (
            <Card variant="bordered">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No incidents found</p>
              </CardContent>
            </Card>
          ) : (
            filteredIncidents.map((incident) => {
              const TypeIcon = typeIcons[incident.type as keyof typeof typeIcons] || AlertTriangle;
              const isSelected = selectedIncident?.id === incident.id;

              return (
                <Card
                  key={incident.id}
                  variant="bordered"
                  className={`cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedIncident(isSelected ? null : incident)}
                >
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          incident.severity === "critical" || incident.severity === "major"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : incident.severity === "moderate"
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <TypeIcon
                          className={`w-6 h-6 ${
                            incident.severity === "critical" || incident.severity === "major"
                              ? "text-red-600"
                              : incident.severity === "moderate"
                              ? "text-yellow-600"
                              : "text-gray-500"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {incident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </h3>
                          <Badge
                            variant={severityColors[incident.severity as keyof typeof severityColors] || "default"}
                            size="sm"
                          >
                            {incident.severity}
                          </Badge>
                          <Badge
                            variant={statusColors[incident.status as keyof typeof statusColors] || "default"}
                            size="sm"
                          >
                            {incident.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {incident.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(incident.reportedAt).toLocaleDateString()}
                          </span>
                          {incident.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location}
                            </span>
                          )}
                          {incident.vehicle && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {incident.vehicle.licensePlate}
                            </span>
                          )}
                          {incident.driver && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {incident.driver.user.firstName} {incident.driver.user.lastName}
                            </span>
                          )}
                          {incident.videos.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              {incident.videos.length} video(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Incident Details Panel */}
        <div className="lg:col-span-1">
          {selectedIncident ? (
            <Card variant="bordered" className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedIncident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900 dark:text-white">{selectedIncident.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Severity</p>
                    <Badge variant={severityColors[selectedIncident.severity as keyof typeof severityColors] || "default"}>
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge variant={statusColors[selectedIncident.status as keyof typeof statusColors] || "default"}>
                      {selectedIncident.status}
                    </Badge>
                  </div>
                </div>

                {selectedIncident.location && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900 dark:text-white">{selectedIncident.location}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {selectedIncident.vehicle && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIncident.vehicle.licensePlate}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedIncident.vehicle.make} {selectedIncident.vehicle.model}
                    </p>
                  </div>
                )}

                {selectedIncident.driver && (
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedIncident.driver.user.firstName} {selectedIncident.driver.user.lastName}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Reported</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedIncident.reportedAt).toLocaleString()}
                  </p>
                </div>

                {selectedIncident.resolvedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedIncident.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedIncident.resolution && (
                  <div>
                    <p className="text-sm text-gray-500">Resolution</p>
                    <p className="text-gray-900 dark:text-white">{selectedIncident.resolution}</p>
                  </div>
                )}

                {/* Video Attachments */}
                {selectedIncident.videos.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Video Evidence</p>
                    <div className="space-y-2">
                      {selectedIncident.videos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <Video className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                            {video.filename}
                          </span>
                          <Badge size="sm" variant={video.status === "ready" ? "success" : "warning"}>
                            {video.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                  <Button variant="outline" size="sm" className="flex-1">
                    View on Map
                  </Button>
                  <Button size="sm" className="flex-1">
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card variant="bordered">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select an incident to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
