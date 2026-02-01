# FleetTrack Pro - User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Live Tracking](#live-tracking)
5. [Vehicle Management](#vehicle-management)
6. [Driver Management](#driver-management)
7. [ELD & Hours of Service](#eld--hours-of-service)
8. [Geofence Management](#geofence-management)
9. [Incident Reporting](#incident-reporting)
10. [Analytics & Reports](#analytics--reports)
11. [Settings](#settings)
12. [Admin Panel](#admin-panel)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is FleetTrack Pro?

FleetTrack Pro is a comprehensive fleet management and telematics platform designed to help you:

- **Track vehicles in real-time** - See where all your vehicles are on a live map
- **Manage drivers** - Keep track of driver information, assignments, and performance
- **Stay DOT compliant** - Electronic Logging Device (ELD) compliance for Hours of Service
- **Set up geofences** - Get alerts when vehicles enter or leave designated areas
- **Report incidents** - Document and track accidents, breakdowns, and violations
- **Analyze performance** - View fleet analytics and make data-driven decisions

### User Roles

Depending on your role, you'll have different access levels:

| Role | Access Level |
|------|--------------|
| **SaaS Admin** | Full platform access, manage all organizations |
| **Company Admin** | Full access to your organization's data |
| **Fleet Manager** | Manage vehicles, drivers, and view reports |
| **Driver** | View own ELD logs and limited information |

---

## Getting Started

### Logging In

1. Open your web browser and go to the FleetTrack Pro URL
2. Enter your **email address**
3. Enter your **password**
4. Click **Sign In**

![Login Screen](./images/login.png)

### Demo Credentials

For testing purposes, use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| SaaS Admin | admin@fleettrack.com | FleetTrack2024! |
| Company Admin | admin@acmetrucking.com | FleetTrack2024! |
| Fleet Manager | fleet@acmetrucking.com | FleetTrack2024! |
| Driver | driver@acmetrucking.com | FleetTrack2024! |

### Navigation

After logging in, you'll see the main dashboard with a sidebar navigation:

- **Dashboard** - Overview of fleet status
- **Live Tracking** - Real-time vehicle map
- **Vehicles** - Vehicle management
- **Drivers** - Driver management
- **ELD Logs** - Electronic Logging Device compliance
- **Geofences** - Geographic boundaries
- **Incidents** - Incident reporting
- **Analytics** - Fleet performance reports
- **Settings** - Account settings
- **Admin** - (SaaS users only) Platform administration

---

## Dashboard Overview

The dashboard provides a quick overview of your fleet's current status.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Active Vehicles** | Vehicles currently in operation |
| **Active Drivers** | Drivers currently on duty |
| **Today's Trips** | Number of trips completed today |
| **Miles Today** | Total miles driven today |
| **Active Alerts** | Unacknowledged alerts |
| **Safety Score** | Overall fleet safety rating |

### Quick Actions

From the dashboard, you can quickly:
- View live tracking map
- See recent alerts
- Access ELD status
- View pending incidents

---

## Live Tracking

The Live Tracking page shows real-time positions of all your vehicles on an interactive map.

### Map Features

- **Vehicle Icons** - Each vehicle is shown as an icon on the map
- **Color Coding**:
  - 🟢 Green - Active/Moving
  - 🟡 Yellow - Idle
  - 🔴 Red - Stopped/Alert
  - ⚫ Gray - Offline

### Vehicle Information

Click on a vehicle to see:
- Current location (address)
- Current speed
- Driver name
- Last update time
- Vehicle status

### Map Controls

- **Zoom** - Use +/- buttons or scroll wheel
- **Pan** - Click and drag the map
- **Center** - Click a vehicle to center on it
- **Refresh** - Data updates automatically every 30 seconds

### Filtering Vehicles

Use the filter options to show:
- All vehicles
- Only active vehicles
- Specific vehicle types
- Vehicles by driver

---

## Vehicle Management

### Viewing Vehicles

The Vehicles page shows a list of all vehicles in your fleet with:
- Vehicle ID / License Plate
- Make and Model
- Current Status
- Assigned Driver
- Last Known Location

### Adding a New Vehicle

1. Click **Add Vehicle** button
2. Fill in the required information:
   - **VIN** - 17-character Vehicle Identification Number
   - **License Plate** - Vehicle registration number
   - **Make** - Vehicle manufacturer (e.g., Freightliner)
   - **Model** - Vehicle model (e.g., Cascadia)
   - **Year** - Manufacturing year
   - **Type** - Truck, Van, Car, or Trailer
   - **Fuel Type** - Diesel, Gasoline, Electric, or Hybrid
3. Click **Save**

### Editing a Vehicle

1. Find the vehicle in the list
2. Click the **Edit** button (pencil icon)
3. Update the necessary fields
4. Click **Save Changes**

### Vehicle Status

| Status | Description |
|--------|-------------|
| **Active** | Vehicle is operational |
| **Inactive** | Vehicle is not currently in use |
| **Maintenance** | Vehicle is undergoing maintenance |
| **Out of Service** | Vehicle is not available for use |

### Assigning a Driver

1. Open the vehicle's edit form
2. Select a driver from the **Assigned Driver** dropdown
3. Click **Save Changes**

---

## Driver Management

### Viewing Drivers

The Drivers page displays all drivers with:
- Driver name
- Contact information
- License details
- Current status
- Assigned vehicle

### Adding a New Driver

1. Click **Add Driver** button
2. Enter driver information:
   - **First Name** and **Last Name**
   - **Email Address**
   - **Phone Number**
   - **License Number**
   - **License State**
   - **License Expiry Date**
3. Click **Save**

### Driver Status

| Status | Description |
|--------|-------------|
| **Available** | Driver is available for dispatch |
| **Driving** | Driver is currently operating a vehicle |
| **Off Duty** | Driver is off duty |
| **Sleeper Berth** | Driver is in sleeper berth |

### License Expiry Alerts

The system automatically tracks license expiration dates and alerts you:
- 30 days before expiry (Warning)
- 7 days before expiry (Critical)
- Expired (Alert)

---

## ELD & Hours of Service

### Understanding ELD Compliance

The Electronic Logging Device (ELD) feature helps you comply with DOT Hours of Service (HOS) regulations.

### HOS Rules Summary

| Rule | Limit |
|------|-------|
| **Driving Limit** | 11 hours maximum |
| **On-Duty Limit** | 14 hours maximum |
| **Required Break** | 30 minutes after 8 hours of driving |
| **Weekly Limit** | 70 hours in 8 days |

### Viewing ELD Logs

1. Navigate to **ELD Logs**
2. Select a date range
3. View all drivers' logs or select a specific driver

### ELD Status Types

| Status | Description |
|--------|-------------|
| **Off Duty** | Not working |
| **Sleeper Berth** | Resting in sleeper berth |
| **Driving** | Operating the vehicle |
| **On Duty (Not Driving)** | Working but not driving |

### Viewing Driver Details

Click on a driver's name to see:
- Full daily log graph
- Status change history
- HOS remaining time
- Violations (if any)

### Certifying Logs

Drivers must certify their logs daily:
1. Review the day's log entries
2. Click **Certify Logs**
3. Add signature if required
4. Submit certification

### HOS Violations

The system alerts you to potential violations:
- **Driving Limit** - Exceeded 11 hours driving
- **Duty Limit** - Exceeded 14 hours on duty
- **Break Required** - Missing required 30-minute break
- **Cycle Limit** - Exceeded 70 hours in 8 days

---

## Geofence Management

### What is a Geofence?

A geofence is a virtual geographic boundary. When a vehicle enters or exits this boundary, you receive an alert.

### Common Uses

- Warehouse/depot arrival notifications
- Customer site monitoring
- Restricted area alerts
- Route deviation detection

### Creating a Geofence

1. Navigate to **Geofences**
2. Click **Add Geofence**
3. Choose geofence type:
   - **Circle** - Define center point and radius
   - **Polygon** - Draw custom shape on map
4. Configure settings:
   - **Name** - Descriptive name
   - **Alert on Entry** - Notify when vehicle enters
   - **Alert on Exit** - Notify when vehicle leaves
5. Click **Save**

### Drawing a Geofence

**Circle Geofence:**
1. Click on the map to set center point
2. Adjust radius using the slider (in meters)

**Polygon Geofence:**
1. Click on the map to add points
2. Connect at least 3 points
3. Close the shape by clicking the first point

### Managing Geofences

- **Edit** - Modify name, shape, or alert settings
- **Toggle Active** - Enable/disable the geofence
- **Delete** - Remove the geofence

### Geofence Alerts

When a vehicle crosses a geofence boundary:
1. Alert appears in the Alerts panel
2. Notification is logged with timestamp
3. Vehicle and driver information is recorded

---

## Incident Reporting

### Reporting an Incident

1. Navigate to **Incidents**
2. Click **Report Incident**
3. Fill in incident details:
   - **Type** - Accident, Breakdown, Theft, Vandalism, Traffic Violation
   - **Severity** - Low, Medium, High, Critical
   - **Title** - Brief description
   - **Description** - Detailed account
   - **Vehicle** - Select involved vehicle
   - **Driver** - Select involved driver
   - **Location** - Where it occurred
4. Click **Submit**

### Incident Types

| Type | Description |
|------|-------------|
| **Accident** | Vehicle collision or crash |
| **Breakdown** | Mechanical failure |
| **Theft** | Cargo or vehicle theft |
| **Vandalism** | Intentional damage |
| **Traffic Violation** | Speeding, red light, etc. |

### Severity Levels

| Level | Description |
|-------|-------------|
| **Low** | Minor issue, no injuries |
| **Medium** | Moderate damage or delay |
| **High** | Significant damage or risk |
| **Critical** | Serious injuries or major loss |

### Incident Status

| Status | Description |
|--------|-------------|
| **Open** | Newly reported |
| **Investigating** | Under investigation |
| **Resolved** | Issue has been resolved |
| **Closed** | Case closed |

### Updating an Incident

1. Find the incident in the list
2. Click to view details
3. Click **Update Status**
4. Add notes or change status
5. Click **Save**

---

## Analytics & Reports

### Dashboard Analytics

The Analytics page provides insights into fleet performance:

### Key Metrics

- **Total Miles** - Distance traveled
- **Fuel Usage** - Gallons consumed
- **Average MPG** - Fuel efficiency
- **Safety Score** - Based on driving behavior
- **On-Time Percentage** - Delivery reliability

### Charts and Graphs

- **Miles Driven** - Daily/weekly/monthly trends
- **Fuel Consumption** - Usage over time
- **Safety Events** - Incidents by type
- **Driver Performance** - Comparison charts

### Filtering Data

Use filters to narrow down reports:
- Date range
- Specific vehicles
- Specific drivers
- Vehicle types

### Exporting Reports

1. Configure your report filters
2. Click **Export**
3. Choose format (CSV or PDF)
4. Download the file

---

## Settings

### Profile Settings

Update your personal information:
- First Name and Last Name
- Phone Number
- Profile Picture

### Password Change

1. Go to **Settings** > **Security**
2. Enter current password
3. Enter new password (must meet requirements)
4. Confirm new password
5. Click **Update Password**

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Notification Preferences

Configure how you receive alerts:
- **Email Notifications** - Receive alerts via email
- **In-App Notifications** - See alerts in the app
- **Alert Types** - Choose which alerts to receive

### Display Preferences

- **Theme** - Light or Dark mode
- **Time Zone** - Your local time zone
- **Date Format** - MM/DD/YYYY or DD/MM/YYYY
- **Units** - Miles/Gallons or Kilometers/Liters

---

## Admin Panel

*Available to SaaS Administrators only*

### User Management

**Viewing Users:**
- See all users across all organizations
- Filter by role, status, or organization

**Creating Users:**
1. Click **Add User**
2. Enter user details
3. Select role
4. Assign to organization
5. Set temporary password
6. Click **Create**

**Editing Users:**
- Update user information
- Change roles
- Reset passwords
- Deactivate accounts

### Organization Management

**Viewing Organizations:**
- List of all organizations
- User count per organization
- Subscription status

**Creating Organizations:**
1. Click **Add Organization**
2. Enter organization name
3. Set subscription tier
4. Click **Create**

**Managing Organizations:**
- Update organization details
- View organization users
- Manage subscription

---

## Troubleshooting

### Common Issues

**Can't Log In**
- Verify email and password are correct
- Check if Caps Lock is on
- Try resetting your password
- Contact your administrator

**Map Not Loading**
- Check internet connection
- Refresh the page
- Clear browser cache
- Try a different browser

**Vehicle Not Showing on Map**
- Check if vehicle is active
- Verify GPS device is connected
- Check last update time
- Contact support if offline > 24 hours

**ELD Data Missing**
- Check device connection
- Verify driver is logged in
- Check for data sync issues
- Contact support

**Reports Not Generating**
- Verify date range is valid
- Check if data exists for the period
- Try a smaller date range
- Clear browser cache

### Getting Help

**In-App Help:**
- Click the **?** icon for contextual help
- View tooltips by hovering over icons

**Contact Support:**
- Email: support@fleettrack.com
- Phone: 1-800-XXX-XXXX
- Hours: Mon-Fri, 8 AM - 6 PM EST

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Open search |
| `Ctrl + H` | Go to Dashboard |
| `Ctrl + M` | Open Map |
| `Esc` | Close modal/dialog |

---

## Glossary

| Term | Definition |
|------|------------|
| **DOT** | Department of Transportation |
| **ELD** | Electronic Logging Device |
| **HOS** | Hours of Service |
| **Geofence** | Virtual geographic boundary |
| **VIN** | Vehicle Identification Number |
| **Telematics** | Technology for monitoring vehicles remotely |
| **GPS** | Global Positioning System |
| **MPG** | Miles Per Gallon |

---

## Tips for Efficient Use

1. **Check Dashboard Daily** - Review fleet status every morning
2. **Set Up Geofences** - Create zones for key locations
3. **Monitor Alerts** - Address alerts promptly
4. **Review ELD Logs** - Check for compliance issues weekly
5. **Use Filters** - Narrow down data for better insights
6. **Export Reports** - Keep records for compliance
7. **Train Drivers** - Ensure drivers know how to use the app
8. **Update Information** - Keep vehicle and driver data current

---

*Last Updated: February 2025*
*Version: 1.0*
