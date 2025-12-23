"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  toast,
} from "@/components/ui";
import {
  User,
  Bell,
  Globe,
  Shield,
  Save,
} from "lucide-react";
import { SessionUser } from "@/types";

interface SettingsPageProps {
  user: SessionUser;
}

export function SettingsPage({ user }: SettingsPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    darkMode: false,
    distanceUnit: "miles",
    timezone: "America/Chicago",
    dateFormat: "MM/DD/YYYY",
    mapView: "street",
    trafficLayer: true,
    autoRefresh: true,
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    safetyAlerts: true,
    eldViolations: true,
    geofenceAlerts: true,
    maintenanceReminders: false,
    weeklyReports: false,
  });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorPhone, setTwoFactorPhone] = useState("");

  const handleProfileSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update preferences");
      }

      toast.success("Preferences saved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update notifications");
      }

      toast.success("Notification preferences saved!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSetup = async () => {
    if (!twoFactorPhone || twoFactorPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/settings/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: twoFactorPhone, enable: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enable 2FA");
      }

      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      toast.success("Two-factor authentication enabled!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/settings/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disable 2FA");
      }

      setTwoFactorEnabled(false);
      toast.success("Two-factor authentication disabled!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card variant="bordered">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="lg:col-span-3 space-y-6">
        {activeTab === "profile" && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-400">
                    {user.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                defaultValue={user.email}
                disabled
                helperText="Contact admin to change email"
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProfileData({ firstName: user.firstName, lastName: user.lastName, phone: "" })}>
                Cancel
              </Button>
              <Button onClick={handleProfileSubmit} loading={loading}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handlePasswordSubmit} loading={loading}>
                  Update Password
                </Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                {!showTwoFactorSetup ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        SMS Authentication
                      </p>
                      <p className="text-sm text-gray-500">
                        {twoFactorEnabled
                          ? "Two-factor authentication is enabled"
                          : "Receive a code via SMS to verify your identity"}
                      </p>
                    </div>
                    {twoFactorEnabled ? (
                      <Button variant="outline" onClick={handleDisableTwoFactor} loading={loading}>
                        Disable
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => setShowTwoFactorSetup(true)}>
                        Enable
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter your phone number to receive verification codes
                    </p>
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={twoFactorPhone}
                      onChange={(e) => setTwoFactorPhone(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleTwoFactorSetup} loading={loading}>
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Current Session
                      </p>
                      <p className="text-sm text-gray-500">
                        Chrome on macOS - Active now
                      </p>
                    </div>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ToggleSetting
                title="Email Notifications"
                description="Receive email alerts for important events"
                checked={notifications.emailNotifications}
                onChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
              />
              <ToggleSetting
                title="Push Notifications"
                description="Receive browser push notifications"
                checked={notifications.pushNotifications}
                onChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
              />
              <ToggleSetting
                title="Safety Alerts"
                description="Get notified about safety events and incidents"
                checked={notifications.safetyAlerts}
                onChange={(checked) => setNotifications({ ...notifications, safetyAlerts: checked })}
              />
              <ToggleSetting
                title="ELD Violations"
                description="Receive alerts when drivers exceed HOS limits"
                checked={notifications.eldViolations}
                onChange={(checked) => setNotifications({ ...notifications, eldViolations: checked })}
              />
              <ToggleSetting
                title="Geofence Alerts"
                description="Get notified when vehicles enter or exit geofences"
                checked={notifications.geofenceAlerts}
                onChange={(checked) => setNotifications({ ...notifications, geofenceAlerts: checked })}
              />
              <ToggleSetting
                title="Maintenance Reminders"
                description="Receive upcoming maintenance notifications"
                checked={notifications.maintenanceReminders}
                onChange={(checked) => setNotifications({ ...notifications, maintenanceReminders: checked })}
              />
              <ToggleSetting
                title="Weekly Reports"
                description="Receive weekly fleet performance summaries"
                checked={notifications.weeklyReports}
                onChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNotificationsSubmit} loading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ToggleSetting
                  title="Dark Mode"
                  description="Switch between light and dark themes"
                  checked={preferences.darkMode}
                  onChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Distance Unit
                  </label>
                  <select
                    value={preferences.distanceUnit}
                    onChange={(e) => setPreferences({ ...preferences, distanceUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="miles">Miles</option>
                    <option value="kilometers">Kilometers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Map Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Map View
                  </label>
                  <select
                    value={preferences.mapView}
                    onChange={(e) => setPreferences({ ...preferences, mapView: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="street">Street Map</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                  </select>
                </div>

                <ToggleSetting
                  title="Traffic Layer"
                  description="Show real-time traffic conditions"
                  checked={preferences.trafficLayer}
                  onChange={(checked) => setPreferences({ ...preferences, trafficLayer: checked })}
                />

                <ToggleSetting
                  title="Auto-refresh"
                  description="Automatically update vehicle positions"
                  checked={preferences.autoRefresh}
                  onChange={(checked) => setPreferences({ ...preferences, autoRefresh: checked })}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handlePreferencesSubmit} loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToggleSettingProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ title, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
