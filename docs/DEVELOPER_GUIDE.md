# FleetTrack Pro - Developer Guide

**Version:** 2.0
**Last Updated:** February 2025
**Platform:** Next.js 16 / PostgreSQL / Prisma

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Overview](#11-overview)
   - 1.2 [Key Features](#12-key-features)
   - 1.3 [Architecture Summary](#13-architecture-summary)

2. [Getting Started](#2-getting-started)
   - 2.1 [Prerequisites](#21-prerequisites)
   - 2.2 [Installation](#22-installation)
   - 2.3 [Environment Configuration](#23-environment-configuration)
   - 2.4 [Database Setup](#24-database-setup)
   - 2.5 [Running the Application](#25-running-the-application)

3. [Project Structure](#3-project-structure)
   - 3.1 [Directory Layout](#31-directory-layout)
   - 3.2 [Key Directories](#32-key-directories)

4. [Technology Stack](#4-technology-stack)
   - 4.1 [Core Technologies](#41-core-technologies)
   - 4.2 [Dependencies](#42-dependencies)

5. [Architecture](#5-architecture)
   - 5.1 [Layer Architecture](#51-layer-architecture)
   - 5.2 [Request Flow](#52-request-flow)
   - 5.3 [Multi-Tenant Architecture](#53-multi-tenant-architecture)

6. [Database Schema](#6-database-schema)
   - 6.1 [Entity Relationship Overview](#61-entity-relationship-overview)
   - 6.2 [Organization Model](#62-organization-model)
   - 6.3 [User Model](#63-user-model)
   - 6.4 [Session & Token Models](#64-session--token-models)
   - 6.5 [Driver Model](#65-driver-model)
   - 6.6 [Vehicle Model](#66-vehicle-model)
   - 6.7 [Vehicle Assignment Model](#67-vehicle-assignment-model)
   - 6.8 [IOT Device Model](#68-iot-device-model)
   - 6.9 [Vehicle Location Model](#69-vehicle-location-model)
   - 6.10 [Vehicle Telemetry Model](#610-vehicle-telemetry-model)
   - 6.11 [Vehicle Diagnostic Model](#611-vehicle-diagnostic-model)
   - 6.12 [ELD Log Model](#612-eld-log-model)
   - 6.13 [Route Model](#613-route-model)
   - 6.14 [Trip Model](#614-trip-model)
   - 6.15 [Geofence Model](#615-geofence-model)
   - 6.16 [Safety Event Model](#616-safety-event-model)
   - 6.17 [Incident Model](#617-incident-model)
   - 6.18 [Video Model](#618-video-model)
   - 6.19 [Maintenance Record Model](#619-maintenance-record-model)
   - 6.20 [Fuel Record Model](#620-fuel-record-model)
   - 6.21 [Alert Model](#621-alert-model)
   - 6.22 [Audit Log Model](#622-audit-log-model)
   - 6.23 [Database Indexes](#623-database-indexes)

7. [Authentication & Authorization](#7-authentication--authorization)
   - 7.1 [Authentication Flow](#71-authentication-flow)
   - 7.2 [User Roles](#72-user-roles)
   - 7.3 [Role Permissions Matrix](#73-role-permissions-matrix)
   - 7.4 [Session Management](#74-session-management)
   - 7.5 [Role Helper Functions](#75-role-helper-functions)

8. [API Reference](#8-api-reference)
   - 8.1 [API Overview](#81-api-overview)
   - 8.2 [Authentication Endpoints](#82-authentication-endpoints)
   - 8.3 [Vehicle Endpoints](#83-vehicle-endpoints)
   - 8.4 [Driver Endpoints](#84-driver-endpoints)
   - 8.5 [Tracking Endpoints](#85-tracking-endpoints)
   - 8.6 [ELD Endpoints](#86-eld-endpoints)
   - 8.7 [Trip Endpoints](#87-trip-endpoints)
   - 8.8 [Geofence Endpoints](#88-geofence-endpoints)
   - 8.9 [Incident Endpoints](#89-incident-endpoints)
   - 8.10 [Alert Endpoints](#810-alert-endpoints)
   - 8.11 [Analytics Endpoints](#811-analytics-endpoints)
   - 8.12 [Admin Endpoints](#812-admin-endpoints)
   - 8.13 [Settings Endpoints](#813-settings-endpoints)
   - 8.14 [Utility Endpoints](#814-utility-endpoints)

9. [Rate Limiting](#9-rate-limiting)
   - 9.1 [Rate Limit Types](#91-rate-limit-types)
   - 9.2 [Configuration](#92-configuration)
   - 9.3 [Response Headers](#93-response-headers)

10. [Error Handling](#10-error-handling)
    - 10.1 [HTTP Status Codes](#101-http-status-codes)
    - 10.2 [Error Response Format](#102-error-response-format)
    - 10.3 [Validation Errors](#103-validation-errors)

11. [API Handler Pattern](#11-api-handler-pattern)
    - 11.1 [createApiHandler Utility](#111-createapihandler-utility)
    - 11.2 [Usage Example](#112-usage-example)

12. [Testing](#12-testing)
    - 12.1 [Test Structure](#121-test-structure)
    - 12.2 [Running Tests](#122-running-tests)

13. [Deployment](#13-deployment)
    - 13.1 [Vercel Deployment](#131-vercel-deployment)
    - 13.2 [Environment Variables](#132-environment-variables)

14. [Best Practices](#14-best-practices)
    - 14.1 [Code Style](#141-code-style)
    - 14.2 [Security Guidelines](#142-security-guidelines)
    - 14.3 [API Development](#143-api-development)

---

## 1. Introduction

### 1.1 Overview

FleetTrack Pro is an enterprise-grade telematics platform designed for comprehensive fleet management. Built with modern web technologies, it provides real-time vehicle tracking, driver management, ELD (Electronic Logging Device) compliance, geofencing, incident reporting, and detailed analytics.

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Real-time GPS Tracking** | Live vehicle location monitoring with telemetry data |
| **Driver Management** | Complete driver profile, assignment, and performance tracking |
| **ELD Compliance** | DOT-compliant Hours of Service (HOS) logging and certification |
| **Geofencing** | Create and monitor geographic boundaries with entry/exit alerts |
| **Incident Reporting** | Document and track fleet incidents with video support |
| **Fleet Analytics** | Comprehensive reporting on trips, safety, fuel, and maintenance |
| **Multi-tenant SaaS** | Support for multiple organizations with role-based access |
| **Vehicle Telemetry** | Engine diagnostics, fuel levels, and performance metrics |
| **Maintenance Tracking** | Scheduled and unscheduled maintenance records |
| **Safety Monitoring** | Track harsh braking, speeding, and other safety events |

### 1.3 Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                             │
│              React Components + Next.js Pages                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP ROUTER                             │
│              API Routes + Server Components                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   NextAuth.js    │ │ Rate Limiter │ │    Zod           │
│  (Authentication)│ │ (Upstash/Mem)│ │  (Validation)    │
└──────────────────┘ └──────────────┘ └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PRISMA ORM                                   │
│              Database Abstraction Layer                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL (Neon)                              │
│                   Primary Database                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Getting Started

### 2.1 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18.x+ | JavaScript runtime |
| npm/yarn | Latest | Package management |
| PostgreSQL | 14+ | Database (or Neon account) |
| Git | Latest | Version control |

### 2.2 Installation

```bash
# Clone the repository
git clone https://github.com/your-org/telematics.git
cd telematics

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2.3 Environment Configuration

Create a `.env` file with the following variables:

```env
# ═══════════════════════════════════════════════════════════════
# DATABASE CONFIGURATION
# ═══════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://username:password@host:5432/fleettrack?sslmode=require"

# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION (NextAuth.js)
# ═══════════════════════════════════════════════════════════════
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-32-character-secret-here"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# ═══════════════════════════════════════════════════════════════
# RATE LIMITING (Optional - uses memory fallback if not set)
# ═══════════════════════════════════════════════════════════════
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Rate limit configuration
RATE_LIMIT_MAX="100"           # Max requests per window
RATE_LIMIT_WINDOW_MS="60000"   # Window size in milliseconds

# ═══════════════════════════════════════════════════════════════
# ERROR TRACKING (Optional)
# ═══════════════════════════════════════════════════════════════
SENTRY_DSN="https://your-sentry-dsn"

# ═══════════════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ═══════════════════════════════════════════════════════════════
NODE_ENV="development"
```

### 2.4 Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy

# Seed the database with sample data
curl -X POST http://localhost:3000/api/seed
```

### 2.5 Running the Application

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## 3. Project Structure

### 3.1 Directory Layout

```
telematics/
├── docs/                           # Documentation
│   ├── DEVELOPER_GUIDE.md
│   ├── USER_MANUAL.md
│   └── *.docx                      # Word format docs
│
├── e2e/                            # End-to-end tests
│   ├── api.spec.ts
│   ├── auth.spec.ts
│   └── dashboard.spec.ts
│
├── prisma/
│   └── schema.prisma               # Database schema
│
├── public/
│   └── assets/                     # Static assets
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth routes group
│   │   │   └── login/page.tsx
│   │   │
│   │   ├── (dashboard)/            # Dashboard routes group
│   │   │   ├── admin/              # Admin panel
│   │   │   ├── analytics/          # Fleet analytics
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   ├── drivers/            # Driver management
│   │   │   ├── eld/                # ELD compliance
│   │   │   ├── geofences/          # Geofence management
│   │   │   ├── incidents/          # Incident reporting
│   │   │   ├── settings/           # User settings
│   │   │   ├── tracking/           # Live tracking
│   │   │   ├── vehicles/           # Vehicle management
│   │   │   └── layout.tsx          # Dashboard layout
│   │   │
│   │   ├── api/                    # API Routes
│   │   │   ├── admin/              # Admin APIs
│   │   │   ├── alerts/             # Alert APIs
│   │   │   ├── analytics/          # Analytics APIs
│   │   │   ├── auth/               # Auth APIs
│   │   │   ├── csrf/               # CSRF token
│   │   │   ├── drivers/            # Driver APIs
│   │   │   ├── eld/                # ELD APIs
│   │   │   ├── geofences/          # Geofence APIs
│   │   │   ├── health/             # Health check
│   │   │   ├── incidents/          # Incident APIs
│   │   │   ├── seed/               # Database seeding
│   │   │   ├── settings/           # Settings APIs
│   │   │   ├── simulator/          # Vehicle simulator
│   │   │   ├── tracking/           # Tracking APIs
│   │   │   ├── trips/              # Trip APIs
│   │   │   └── vehicles/           # Vehicle APIs
│   │   │
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   │
│   ├── components/
│   │   ├── dashboard/              # Dashboard components
│   │   └── ui/                     # Base UI components
│   │
│   ├── hooks/                      # Custom React hooks
│   │   └── useCsrf.ts
│   │
│   ├── lib/                        # Core utilities
│   │   ├── apiUtils.ts             # API handler utilities
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── csrf.ts                 # CSRF protection
│   │   ├── db.ts                   # Prisma client
│   │   ├── logger.ts               # Logging utilities
│   │   ├── rateLimit.ts            # Rate limiting
│   │   └── tokenRevocation.ts      # Token management
│   │
│   ├── types/                      # TypeScript definitions
│   │   ├── models/                 # Domain models
│   │   ├── api.types.ts            # API types
│   │   └── index.ts                # Type exports
│   │
│   └── middleware.ts               # Next.js middleware
│
├── .env.example                    # Environment template
├── next.config.ts                  # Next.js config
├── package.json                    # Dependencies
├── playwright.config.ts            # E2E test config
├── tailwind.config.ts              # Tailwind config
└── tsconfig.json                   # TypeScript config
```

### 3.2 Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/api/` | All REST API endpoints |
| `src/app/(dashboard)/` | Protected dashboard pages |
| `src/lib/` | Core utilities and configurations |
| `src/types/` | TypeScript type definitions |
| `prisma/` | Database schema and migrations |
| `e2e/` | Playwright end-to-end tests |

---

## 4. Technology Stack

### 4.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.x | React framework with App Router |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Database** | PostgreSQL | 14+ | Primary data store |
| **ORM** | Prisma | 6.x | Database abstraction |
| **Authentication** | NextAuth.js | 5.x | Auth handling |
| **Validation** | Zod | 3.x | Schema validation |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Hosting** | Vercel | - | Deployment platform |

### 4.2 Dependencies

**Production Dependencies:**
- `next` - React framework
- `react` / `react-dom` - UI library
- `@prisma/client` - Database client
- `next-auth` - Authentication
- `bcryptjs` - Password hashing
- `zod` - Validation
- `uuid` - ID generation
- `rate-limiter-flexible` - Rate limiting
- `@upstash/ratelimit` - Redis rate limiting
- `pino` - Logging

**Development Dependencies:**
- `typescript` - Type checking
- `prisma` - Database tooling
- `@playwright/test` - E2E testing
- `vitest` - Unit testing
- `eslint` - Linting
- `tailwindcss` - CSS framework

---

## 5. Architecture

### 5.1 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
│         React Components, Pages, Layouts, Client State           │
│                    src/app/, src/components/                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│           Next.js API Routes, Request Handlers                   │
│                    src/app/api/                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                               │
│      Authentication, Rate Limiting, Validation, Logging          │
│                      src/lib/                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                            │
│                 Prisma ORM, Database Queries                     │
│                    src/lib/db.ts                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                    │
│                   PostgreSQL (Neon)                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Request Flow

1. **Client Request** → Browser/App sends HTTP request
2. **Next.js Middleware** → Route protection, redirects
3. **API Route Handler** → Receives request
4. **Rate Limiting** → Check request limits
5. **Authentication** → Validate session (NextAuth)
6. **Authorization** → Check user role permissions
7. **Validation** → Validate request body (Zod)
8. **Business Logic** → Process request
9. **Database Query** → Prisma ORM operations
10. **Response** → JSON response to client

### 5.3 Multi-Tenant Architecture

FleetTrack Pro supports multi-tenancy through organization-based data isolation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SaaS Platform Level                           │
│         Platform Admins (saas_admin, saas_support, etc.)         │
│              Can access ALL organizations                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Organization A  │ │  Organization B  │ │  Organization C  │
│  ─────────────── │ │  ─────────────── │ │  ─────────────── │
│  Users           │ │  Users           │ │  Users           │
│  Vehicles        │ │  Vehicles        │ │  Vehicles        │
│  Drivers         │ │  Drivers         │ │  Drivers         │
│  Trips           │ │  Trips           │ │  Trips           │
│  Incidents       │ │  Incidents       │ │  Incidents       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Data Isolation Rules:**
- Company users can only access data within their `organizationId`
- SaaS users have cross-organization access
- All queries automatically filter by `organizationId` when applicable

---

## 6. Database Schema

### 6.1 Entity Relationship Overview

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Organization │──┬──▶│    User      │──┬──▶│   Session    │
└──────────────┘  │   └──────────────┘  │   └──────────────┘
       │          │          │          │
       │          │          ▼          │
       │          │   ┌──────────────┐  │
       │          │   │   AuditLog   │  │
       │          │   └──────────────┘  │
       │          │                     │
       │          │          ┌──────────┘
       │          │          ▼
       │          │   ┌──────────────┐      ┌──────────────┐
       │          └──▶│   Driver     │◀────▶│   Vehicle    │
       │              └──────────────┘      └──────────────┘
       │                     │                    │
       │                     ▼                    ▼
       │              ┌──────────────┐    ┌──────────────┐
       │              │   ELDLog     │    │  IOTDevice   │
       │              └──────────────┘    └──────────────┘
       │                     │                    │
       │                     ▼                    ▼
       │              ┌──────────────┐    ┌──────────────┐
       │              │    Trip      │    │VehicleLocation│
       │              └──────────────┘    └──────────────┘
       │                                         │
       │              ┌──────────────┐           ▼
       ├─────────────▶│  Geofence    │    ┌──────────────┐
       │              └──────────────┘    │VehicleTelemetry│
       │                     │            └──────────────┘
       │                     ▼
       │              ┌──────────────┐
       ├─────────────▶│   Alert      │
       │              └──────────────┘
       │
       │              ┌──────────────┐
       └─────────────▶│  Incident    │
                      └──────────────┘
```

### 6.2 Organization Model

The root tenant model for multi-tenancy.

```prisma
model Organization {
  id            String   @id @default(cuid())
  name          String                           // Company name
  slug          String   @unique                 // URL-friendly identifier
  address       String?                          // Physical address
  phone         String?                          // Contact phone
  email         String?                          // Contact email
  logo          String?                          // Logo URL
  subscription  String   @default("trial")       // trial|basic|professional|enterprise
  status        String   @default("active")      // active|suspended|cancelled
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  users         User[]
  vehicles      Vehicle[]
  drivers       Driver[]
  geofences     Geofence[]
  alerts        Alert[]
  incidents     Incident[]
  routes        Route[]
}
```

**Field Details:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Unique identifier |
| `name` | String | Organization display name |
| `slug` | String (unique) | URL-safe identifier |
| `subscription` | Enum | `trial`, `basic`, `professional`, `enterprise` |
| `status` | Enum | `active`, `suspended`, `cancelled` |

### 6.3 User Model

User accounts with authentication and preferences.

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String                    // bcrypt hashed
  firstName             String
  lastName              String
  phone                 String?
  avatar                String?                   // Avatar URL
  role                  String                    // User role (see 7.2)
  status                String    @default("active")  // active|inactive|suspended
  emailVerified         DateTime?
  lastLogin             DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Two-Factor Authentication
  twoFactorEnabled      Boolean   @default(false)
  twoFactorSecret       String?                   // TOTP secret
  twoFactorPhone        String?                   // SMS fallback

  // User Preferences (JSON strings)
  preferences           String?   // {darkMode, distanceUnit, timezone, dateFormat, mapView}
  notificationSettings  String?   // {emailNotifications, pushNotifications, safetyAlerts}

  // Organization (null for SaaS users)
  organizationId        String?
  organization          Organization? @relation(...)

  // Relations
  driver                Driver?
  sessions              Session[]
  auditLogs             AuditLog[]
  passwordResetTokens   PasswordResetToken[]

  @@index([organizationId])
  @@index([role])
  @@index([status])
}
```

**User Roles:**

| Role | Type | Description |
|------|------|-------------|
| `saas_admin` | SaaS | Full platform access |
| `saas_subscriber_manager` | SaaS | Manage subscriptions |
| `saas_support` | SaaS | Customer support |
| `saas_developer` | SaaS | Developer access |
| `company_admin` | Company | Full organization access |
| `fleet_manager` | Company | Fleet operations |
| `driver` | Company | Driver-only access |
| `company_support` | Company | Organization support |

### 6.4 Session & Token Models

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(...)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}

model RevokedToken {
  id        String   @id @default(cuid())
  jti       String   @unique          // JWT ID or token hash
  userId    String
  reason    String?                   // logout|password_change|admin_revoke|security
  revokedAt DateTime @default(now())
  expiresAt DateTime                  // Original token expiry

  @@index([jti])
  @@index([userId])
  @@index([expiresAt])
}
```

### 6.5 Driver Model

Driver profiles linked to user accounts.

```prisma
model Driver {
  id                String   @id @default(cuid())
  licenseNumber     String                        // CDL number
  licenseState      String                        // 2-letter state code
  licenseExpiry     DateTime
  dotMedicalExpiry  DateTime?                     // DOT medical card expiry
  status            String   @default("available") // available|driving|off_duty|sleeper_berth
  safetyScore       Float    @default(100)        // 0-100 score
  totalMiles        Float    @default(0)
  totalTrips        Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // User link (1:1)
  userId            String   @unique
  user              User     @relation(...)

  // Organization
  organizationId    String
  organization      Organization @relation(...)

  // Current vehicle assignment (optional 1:1)
  currentVehicleId  String?  @unique
  currentVehicle    Vehicle? @relation("CurrentDriver", ...)

  // Relations
  eldLogs           ELDLog[]
  trips             Trip[]
  incidents         Incident[]
  safetyEvents      SafetyEvent[]
  assignments       VehicleAssignment[]

  @@index([organizationId])
  @@index([status])
  @@index([licenseExpiry])
}
```

**Driver Status Values:**

| Status | Description |
|--------|-------------|
| `available` | Ready for assignment |
| `driving` | Currently on a trip |
| `off_duty` | Off duty (ELD) |
| `sleeper_berth` | In sleeper berth (ELD) |

### 6.6 Vehicle Model

Fleet vehicle records with telemetry relationships.

```prisma
model Vehicle {
  id                String   @id @default(cuid())
  vin               String   @unique              // 17-character VIN
  licensePlate      String
  make              String                        // Manufacturer
  model             String                        // Model name
  year              Int                           // Model year
  type              String                        // truck|van|car|trailer
  fuelType          String                        // diesel|gasoline|electric|hybrid
  status            String   @default("inactive") // active|inactive|maintenance|out_of_service
  odometer          Float    @default(0)          // Miles
  engineHours       Float    @default(0)
  lastServiceDate   DateTime?
  nextServiceDue    DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  organizationId    String
  organization      Organization @relation(...)

  // Current driver (optional 1:1)
  currentDriver     Driver?  @relation("CurrentDriver")

  // Relations
  iotDevice         IOTDevice?
  locations         VehicleLocation[]
  telemetry         VehicleTelemetry[]
  diagnostics       VehicleDiagnostic[]
  maintenanceRecords MaintenanceRecord[]
  fuelRecords       FuelRecord[]
  trips             Trip[]
  incidents         Incident[]
  videos            Video[]
  assignments       VehicleAssignment[]

  @@index([organizationId])
  @@index([status])
  @@index([nextServiceDue])
}
```

**Vehicle Types:**

| Type | Description |
|------|-------------|
| `truck` | Commercial truck |
| `van` | Cargo van |
| `car` | Passenger vehicle |
| `trailer` | Trailer unit |

**Vehicle Status:**

| Status | Description |
|--------|-------------|
| `active` | In service, available |
| `inactive` | Not in service |
| `maintenance` | Under maintenance |
| `out_of_service` | DOT out of service |

### 6.7 Vehicle Assignment Model

Track historical driver-vehicle assignments.

```prisma
model VehicleAssignment {
  id          String   @id @default(cuid())
  startDate   DateTime
  endDate     DateTime?
  status      String   @default("active")  // active|completed|cancelled
  createdAt   DateTime @default(now())

  vehicleId   String
  vehicle     Vehicle  @relation(...)

  driverId    String
  driver      Driver   @relation(...)
}
```

### 6.8 IOT Device Model

Telematics devices installed in vehicles.

```prisma
model IOTDevice {
  id            String   @id @default(cuid())
  serialNumber  String   @unique
  type          String                        // gps_tracker|eld|dashcam|dsm|adas
  firmware      String?
  status        String   @default("offline")  // online|offline|error
  lastPing      DateTime?
  config        String?                       // JSON configuration
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  vehicleId     String   @unique
  vehicle       Vehicle  @relation(...)
}
```

**Device Types:**

| Type | Description |
|------|-------------|
| `gps_tracker` | GPS tracking device |
| `eld` | Electronic Logging Device |
| `dashcam` | Dashboard camera |
| `dsm` | Driver Safety Monitor |
| `adas` | Advanced Driver Assistance System |

### 6.9 Vehicle Location Model

GPS position data points.

```prisma
model VehicleLocation {
  id          String   @id @default(cuid())
  latitude    Float                           // -90 to 90
  longitude   Float                           // -180 to 180
  altitude    Float?                          // Meters
  heading     Float?                          // 0-360 degrees
  speed       Float?                          // MPH
  accuracy    Float?                          // Meters
  timestamp   DateTime @default(now())

  vehicleId   String
  vehicle     Vehicle  @relation(...)

  @@index([vehicleId, timestamp])
}
```

### 6.10 Vehicle Telemetry Model

Engine and vehicle sensor data.

```prisma
model VehicleTelemetry {
  id               String   @id @default(cuid())
  engineRpm        Float?                      // RPM
  fuelLevel        Float?                      // Percentage (0-100)
  coolantTemp      Float?                      // Fahrenheit
  oilPressure      Float?                      // PSI
  batteryVoltage   Float?                      // Volts
  throttlePosition Float?                      // Percentage
  engineLoad       Float?                      // Percentage
  intakeAirTemp    Float?                      // Fahrenheit
  massAirflow      Float?                      // g/s
  timestamp        DateTime @default(now())

  vehicleId        String
  vehicle          Vehicle  @relation(...)

  @@index([vehicleId, timestamp])
}
```

### 6.11 Vehicle Diagnostic Model

OBD-II diagnostic trouble codes.

```prisma
model VehicleDiagnostic {
  id          String   @id @default(cuid())
  code        String                          // DTC code (e.g., P0171)
  description String
  severity    String                          // info|warning|critical
  status      String   @default("active")     // active|resolved|ignored
  detectedAt  DateTime @default(now())
  resolvedAt  DateTime?

  vehicleId   String
  vehicle     Vehicle  @relation(...)
}
```

### 6.12 ELD Log Model

Electronic Logging Device records for HOS compliance.

```prisma
model ELDLog {
  id            String   @id @default(cuid())
  date          DateTime                      // Log date
  status        String                        // off_duty|sleeper_berth|driving|on_duty_not_driving
  startTime     DateTime
  endTime       DateTime?
  duration      Int?                          // Minutes
  location      String?                       // Location description
  notes         String?
  certified     Boolean  @default(false)      // Driver certified
  edited        Boolean  @default(false)      // Was edited
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  driverId      String
  driver        Driver   @relation(...)

  @@index([driverId, date])
}
```

**ELD Status Values (DOT Compliant):**

| Status | Code | Description |
|--------|------|-------------|
| `off_duty` | OFF | Off Duty |
| `sleeper_berth` | SB | Sleeper Berth |
| `driving` | D | Driving |
| `on_duty_not_driving` | ON | On Duty (Not Driving) |

### 6.13 Route Model

Predefined routes with waypoints.

```prisma
model Route {
  id              String   @id @default(cuid())
  name            String
  description     String?
  origin          String                       // Origin address
  originLat       Float
  originLng       Float
  destination     String                       // Destination address
  destinationLat  Float
  destinationLng  Float
  waypoints       String?                      // JSON array of waypoints
  distance        Float?                       // Miles
  estimatedTime   Int?                         // Minutes
  status          String   @default("active")  // active|inactive
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organizationId  String
  organization    Organization @relation(...)

  trips           Trip[]
}
```

### 6.14 Trip Model

Vehicle trips with metrics.

```prisma
model Trip {
  id              String   @id @default(cuid())
  startTime       DateTime
  endTime         DateTime?
  startLocation   String
  startLat        Float
  startLng        Float
  endLocation     String?
  endLat          Float?
  endLng          Float?
  distance        Float?                       // Actual miles
  duration        Int?                         // Minutes
  fuelUsed        Float?                       // Gallons
  avgSpeed        Float?                       // MPH
  maxSpeed        Float?                       // MPH
  idleTime        Int?                         // Minutes
  status          String   @default("in_progress")  // scheduled|in_progress|completed|cancelled
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vehicleId       String
  vehicle         Vehicle  @relation(...)

  driverId        String
  driver          Driver   @relation(...)

  routeId         String?
  route           Route?   @relation(...)

  @@index([vehicleId, startTime])
  @@index([driverId, startTime])
  @@index([status])
}
```

### 6.15 Geofence Model

Geographic boundaries with alert triggers.

```prisma
model Geofence {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String                        // circle|polygon
  coordinates   String                        // JSON coordinates
  color         String   @default("#3B82F6")  // Hex color
  alertOnEntry  Boolean  @default(true)
  alertOnExit   Boolean  @default(true)
  status        String   @default("active")   // active|inactive
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  organizationId String
  organization   Organization @relation(...)

  alerts         Alert[]

  @@index([organizationId])
  @@index([status])
}
```

**Coordinates JSON Format:**

Circle:
```json
{
  "lat": 37.7749,
  "lng": -122.4194,
  "radius": 500
}
```

Polygon:
```json
[
  {"lat": 37.7749, "lng": -122.4194},
  {"lat": 37.7849, "lng": -122.4094},
  {"lat": 37.7649, "lng": -122.3994}
]
```

### 6.16 Safety Event Model

Driver safety incidents detected by devices.

```prisma
model SafetyEvent {
  id            String   @id @default(cuid())
  type          String                        // See types below
  severity      String                        // low|medium|high|critical
  latitude      Float?
  longitude     Float?
  speed         Float?                        // MPH at time of event
  data          String?                       // JSON additional data
  timestamp     DateTime @default(now())

  driverId      String
  driver        Driver   @relation(...)

  videoId       String?
  video         Video?   @relation(...)

  @@index([driverId, timestamp])
}
```

**Safety Event Types:**

| Type | Description |
|------|-------------|
| `harsh_braking` | Sudden braking detected |
| `harsh_acceleration` | Rapid acceleration |
| `speeding` | Over speed limit |
| `distraction` | Driver distraction detected |
| `fatigue` | Driver fatigue detected |
| `lane_departure` | Unintended lane change |
| `collision_warning` | Forward collision warning |

### 6.17 Incident Model

Fleet incidents and accidents.

```prisma
model Incident {
  id             String   @id @default(cuid())
  type           String                        // accident|breakdown|theft|vandalism|traffic_violation
  severity       String                        // minor|moderate|major|critical
  description    String
  latitude       Float
  longitude      Float
  location       String?                       // Address description
  status         String   @default("open")     // open|investigating|resolved|closed
  reportedAt     DateTime @default(now())
  resolvedAt     DateTime?
  resolution     String?                       // Resolution notes
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organizationId String
  organization   Organization @relation(...)

  vehicleId      String?
  vehicle        Vehicle? @relation(...)

  driverId       String?
  driver         Driver?  @relation(...)

  videos         Video[]

  @@index([organizationId, status])
  @@index([organizationId, createdAt])
  @@index([severity])
}
```

### 6.18 Video Model

Dashcam and incident videos.

```prisma
model Video {
  id            String   @id @default(cuid())
  filename      String
  url           String                        // Storage URL
  thumbnailUrl  String?
  duration      Int?                          // Seconds
  size          Int?                          // Bytes
  type          String                        // dashcam|cabin|incident|event
  startTime     DateTime
  endTime       DateTime?
  status        String   @default("processing")  // processing|ready|error|deleted
  metadata      String?                       // JSON metadata
  createdAt     DateTime @default(now())

  vehicleId     String
  vehicle       Vehicle  @relation(...)

  incidentId    String?
  incident      Incident? @relation(...)

  safetyEvents  SafetyEvent[]
}
```

### 6.19 Maintenance Record Model

Vehicle maintenance history.

```prisma
model MaintenanceRecord {
  id              String   @id @default(cuid())
  type            String                       // scheduled|unscheduled|repair|inspection
  description     String
  odometer        Float                        // Miles at service
  cost            Float?                       // Total cost
  vendor          String?                      // Service provider
  parts           String?                      // JSON array of parts
  laborHours      Float?
  status          String   @default("completed")  // scheduled|in_progress|completed|cancelled
  scheduledDate   DateTime?
  completedDate   DateTime?
  nextDueDate     DateTime?
  nextDueOdometer Float?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vehicleId       String
  vehicle         Vehicle  @relation(...)
}
```

### 6.20 Fuel Record Model

Fuel purchase records.

```prisma
model FuelRecord {
  id             String   @id @default(cuid())
  date           DateTime
  gallons        Float
  pricePerGallon Float
  totalCost      Float
  odometer       Float                        // Miles at fill
  fuelType       String
  location       String?                      // Station location
  fullTank       Boolean  @default(true)
  notes          String?
  createdAt      DateTime @default(now())

  vehicleId      String
  vehicle        Vehicle  @relation(...)
}
```

### 6.21 Alert Model

System notifications and alerts.

```prisma
model Alert {
  id             String   @id @default(cuid())
  type           String                        // geofence|speeding|maintenance|eld_violation|safety|system
  severity       String                        // info|warning|critical
  title          String
  message        String
  data           String?                       // JSON additional data
  read           Boolean  @default(false)
  acknowledged   Boolean  @default(false)
  createdAt      DateTime @default(now())

  organizationId String
  organization   Organization @relation(...)

  geofenceId     String?
  geofence       Geofence? @relation(...)

  @@index([organizationId, read, createdAt])
  @@index([organizationId, acknowledged])
}
```

**Alert Types:**

| Type | Description |
|------|-------------|
| `geofence` | Geofence entry/exit |
| `speeding` | Speed limit exceeded |
| `maintenance` | Maintenance due |
| `eld_violation` | HOS violation |
| `safety` | Safety event alert |
| `system` | System notification |

### 6.22 Audit Log Model

User action audit trail.

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String                          // create|update|delete|login|logout
  entity      String                          // user|vehicle|driver|etc.
  entityId    String?
  details     String?                         // JSON details
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())

  userId      String
  user        User     @relation(...)

  @@index([userId, timestamp])
  @@index([entity, entityId])
}
```

### 6.23 Database Indexes

Key indexes for query performance:

| Table | Index | Purpose |
|-------|-------|---------|
| User | `organizationId` | Tenant filtering |
| User | `role`, `status` | Role-based queries |
| Driver | `organizationId`, `status` | Fleet queries |
| Driver | `licenseExpiry` | Compliance checks |
| Vehicle | `organizationId`, `status` | Fleet queries |
| Vehicle | `nextServiceDue` | Maintenance alerts |
| VehicleLocation | `vehicleId, timestamp` | Location history |
| VehicleTelemetry | `vehicleId, timestamp` | Telemetry history |
| ELDLog | `driverId, date` | HOS queries |
| Trip | `vehicleId, startTime` | Trip history |
| Trip | `status` | Active trip queries |
| Incident | `organizationId, status` | Incident management |
| Alert | `organizationId, read` | Notification queries |
| AuditLog | `userId, timestamp` | Audit queries |

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│  /api/auth   │────▶│   Prisma     │
│          │     │  /signin     │     │   (User DB)  │
└──────────┘     └──────────────┘     └──────────────┘
     │                  │                    │
     │                  │  Verify Password   │
     │                  │◀───────────────────│
     │                  │                    │
     │    JWT Token     │                    │
     │◀─────────────────│                    │
     │                  │                    │
     │  Subsequent Requests with Token       │
     │─────────────────────────────────────▶ │
```

**Authentication Configuration (`src/lib/auth.ts`):**

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verify credentials against database
        // Return user object or null
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
```

### 7.2 User Roles

**SaaS Roles (Platform Level):**

| Role | Code | Description |
|------|------|-------------|
| Platform Admin | `saas_admin` | Full platform access, all organizations |
| Subscriber Manager | `saas_subscriber_manager` | Manage subscriptions and billing |
| Support | `saas_support` | Customer support access |
| Developer | `saas_developer` | API and developer access |

**Company Roles (Organization Level):**

| Role | Code | Description |
|------|------|-------------|
| Company Admin | `company_admin` | Full organization access |
| Fleet Manager | `fleet_manager` | Manage vehicles, drivers, trips |
| Driver | `driver` | View own data, ELD logs |
| Support | `company_support` | Organization support access |

### 7.3 Role Permissions Matrix

| Permission | saas_admin | saas_support | company_admin | fleet_manager | driver |
|------------|:----------:|:------------:|:-------------:|:-------------:|:------:|
| View All Organizations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage Vehicles | ✅ | ❌ | ✅ | ✅ | ❌ |
| Manage Drivers | ✅ | ❌ | ✅ | ✅ | ❌ |
| View Tracking | ✅ | ✅ | ✅ | ✅ | ✅* |
| Manage ELD Logs | ✅ | ❌ | ✅ | ✅ | ✅* |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage Geofences | ✅ | ❌ | ✅ | ✅ | ❌ |
| Report Incidents | ✅ | ✅ | ✅ | ✅ | ✅ |

*\* Drivers can only view/manage their own data*

### 7.4 Session Management

Session data available in API routes:

```typescript
interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
}

// Access in API routes
const session = await auth();
if (session?.user) {
  console.log(session.user.id);
  console.log(session.user.role);
  console.log(session.user.organizationId);
}
```

### 7.5 Role Helper Functions

```typescript
import {
  isSaaSUser,
  isCompanyUser,
  canManageUsers,
  canManageFleet,
  canViewAnalytics
} from '@/lib/auth';

// Check if user is SaaS-level
isSaaSUser('saas_admin');        // true
isSaaSUser('company_admin');     // false

// Check if user is company-level
isCompanyUser('fleet_manager');  // true
isCompanyUser('saas_admin');     // false

// Check specific permissions
canManageUsers('company_admin'); // true
canManageFleet('fleet_manager'); // true
canViewAnalytics('driver');      // false
```

---

## 8. API Reference

### 8.1 API Overview

**Base URLs:**
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

**Request Headers:**
```
Content-Type: application/json
Cookie: next-auth.session-token=<session-token>
```

**Response Format:**
```json
{
  "data": { ... },
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Format:**
```json
{
  "error": "Error message",
  "details": [ ... ]  // Optional validation details
}
```

### 8.2 Authentication Endpoints

#### POST /api/auth/signin
Sign in with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Session cookie set

#### POST /api/auth/signout
Sign out current session.

#### GET /api/auth/session
Get current session.

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "fleet_manager",
    "organizationId": "clx...",
    "organizationName": "Acme Logistics"
  },
  "expires": "2025-02-02T00:00:00.000Z"
}
```

#### POST /api/auth/logout
Logout and revoke token.

#### POST /api/auth/reset-password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### 8.3 Vehicle Endpoints

#### GET /api/vehicles
List all vehicles for the organization.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter: `active`, `inactive`, `maintenance`, `out_of_service` |
| `type` | string | all | Filter: `truck`, `van`, `car`, `trailer` |

**Response:**
```json
[
  {
    "id": "clx...",
    "vin": "1HGCM82633A123456",
    "licensePlate": "ABC-1234",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2023,
    "type": "truck",
    "fuelType": "diesel",
    "status": "active",
    "odometer": 125000.5,
    "engineHours": 5200.3,
    "currentDriver": {
      "id": "clx...",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "iotDevice": {
      "status": "online",
      "lastPing": "2025-02-01T10:30:00Z"
    }
  }
]
```

#### POST /api/vehicles
Create a new vehicle.

**Required Roles:** `saas_admin`, `company_admin`, `fleet_manager`

**Request:**
```json
{
  "vin": "1HGCM82633A123456",
  "licensePlate": "ABC-1234",
  "make": "Freightliner",
  "model": "Cascadia",
  "year": 2023,
  "type": "truck",
  "fuelType": "diesel"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `vin` | Required, exactly 17 characters |
| `licensePlate` | Required, 1-20 characters |
| `make` | Required, 1-50 characters |
| `model` | Required, 1-50 characters |
| `year` | Required, 1990 to current year + 1 |
| `type` | Required, enum: `truck`, `van`, `car`, `trailer` |
| `fuelType` | Required, enum: `diesel`, `gasoline`, `electric`, `hybrid` |

**Response:** `201 Created`
```json
{
  "id": "clx...",
  "vin": "1HGCM82633A123456",
  ...
}
```

#### GET /api/vehicles/[id]
Get vehicle by ID.

#### PUT /api/vehicles/[id]
Update vehicle.

#### DELETE /api/vehicles/[id]
Delete vehicle.

### 8.4 Driver Endpoints

#### GET /api/drivers
List all drivers.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter: `available`, `driving`, `off_duty`, `sleeper_berth` |
| `limit` | number | 50 | Results per page (1-100) |
| `offset` | number | 0 | Skip results |

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "licenseNumber": "D1234567",
      "licenseState": "CA",
      "licenseExpiry": "2025-12-31T00:00:00Z",
      "status": "available",
      "safetyScore": 95.5,
      "totalMiles": 45000,
      "totalTrips": 230,
      "user": {
        "id": "clx...",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "555-123-4567"
      },
      "currentVehicle": {
        "id": "clx...",
        "licensePlate": "ABC-1234",
        "make": "Freightliner",
        "model": "Cascadia"
      },
      "_count": {
        "trips": 230,
        "incidents": 2,
        "safetyEvents": 15
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST /api/drivers
Create a new driver (also creates user account).

**Required Roles:** `saas_admin`, `company_admin`, `fleet_manager`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-123-4567",
  "licenseNumber": "D1234567",
  "licenseState": "CA",
  "licenseExpiry": "2025-12-31",
  "dotMedicalExpiry": "2025-06-30"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `email` | Required, valid email, unique |
| `firstName` | Required, 1-100 characters |
| `lastName` | Required, 1-100 characters |
| `phone` | Optional |
| `licenseNumber` | Required, 1-50 characters |
| `licenseState` | Required, exactly 2 characters |
| `licenseExpiry` | Required, valid date |
| `dotMedicalExpiry` | Optional, valid date |

**Response:** `201 Created`

**Note:** Creates a user account with default password `driver123` and role `driver`.

### 8.5 Tracking Endpoints

#### GET /api/tracking
Get live tracking data for all active vehicles.

**Response:**
```json
{
  "vehicles": [
    {
      "id": "clx...",
      "licensePlate": "ABC-1234",
      "make": "Freightliner",
      "model": "Cascadia",
      "status": "active",
      "lat": 37.7749,
      "lng": -122.4194,
      "speed": 65,
      "heading": 180,
      "driver": "John Doe",
      "driverStatus": "driving",
      "deviceStatus": "online",
      "lastPing": "2025-02-01T10:30:00Z",
      "telemetry": {
        "engineRpm": 1800,
        "fuelLevel": 75,
        "coolantTemp": 195,
        "batteryVoltage": 14.2
      }
    }
  ],
  "geofences": [
    {
      "id": "clx...",
      "name": "Warehouse A",
      "type": "circle",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194,
        "radius": 500
      },
      "color": "#3B82F6",
      "alertOnEntry": true,
      "alertOnExit": true
    }
  ],
  "timestamp": "2025-02-01T10:30:00Z"
}
```

### 8.6 ELD Endpoints

#### GET /api/eld
Get ELD logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `driverId` | string | Filter by driver ID |
| `date` | string | Filter by date (YYYY-MM-DD) |

**Response:**
```json
[
  {
    "id": "clx...",
    "date": "2025-02-01T00:00:00Z",
    "status": "driving",
    "startTime": "2025-02-01T08:00:00Z",
    "endTime": "2025-02-01T12:00:00Z",
    "duration": 240,
    "location": "Los Angeles, CA",
    "certified": false,
    "driver": {
      "id": "clx...",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
]
```

#### POST /api/eld
Create ELD log entry.

**Request:**
```json
{
  "driverId": "clx...",
  "date": "2025-02-01",
  "status": "driving",
  "startTime": "2025-02-01T08:00:00Z",
  "endTime": "2025-02-01T12:00:00Z",
  "location": "Los Angeles, CA",
  "notes": "Route 66 delivery"
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `off_duty` | Off Duty |
| `sleeper_berth` | Sleeper Berth |
| `driving` | Driving |
| `on_duty_not_driving` | On Duty (Not Driving) |

#### GET /api/eld/status
Get current HOS status for all drivers.

#### POST /api/eld/status
Update driver duty status.

#### POST /api/eld/certify
Certify daily ELD logs.

**Request:**
```json
{
  "driverId": "clx...",
  "date": "2025-02-01"
}
```

### 8.7 Trip Endpoints

#### GET /api/trips
List trips.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `vehicleId` | string | Filter by vehicle |
| `driverId` | string | Filter by driver |
| `limit` | number | Max results (default 100) |

**Response:**
```json
[
  {
    "id": "clx...",
    "startTime": "2025-02-01T08:00:00Z",
    "endTime": "2025-02-01T14:30:00Z",
    "startLocation": "Los Angeles, CA",
    "startLat": 34.0522,
    "startLng": -118.2437,
    "endLocation": "San Francisco, CA",
    "endLat": 37.7749,
    "endLng": -122.4194,
    "distance": 382.5,
    "duration": 390,
    "fuelUsed": 45.2,
    "avgSpeed": 58.8,
    "maxSpeed": 72,
    "idleTime": 25,
    "status": "completed",
    "vehicle": {
      "id": "clx...",
      "licensePlate": "ABC-1234",
      "make": "Freightliner",
      "model": "Cascadia"
    },
    "driver": {
      "id": "clx...",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "route": {
      "id": "clx...",
      "name": "LA to SF Express"
    }
  }
]
```

#### POST /api/trips
Start a new trip.

**Request:**
```json
{
  "vehicleId": "clx...",
  "driverId": "clx...",
  "routeId": "clx...",
  "startLocation": "Los Angeles, CA",
  "startLat": 34.0522,
  "startLng": -118.2437,
  "endLocation": "San Francisco, CA",
  "endLat": 37.7749,
  "endLng": -122.4194
}
```

### 8.8 Geofence Endpoints

#### GET /api/geofences
List all geofences.

**Response:**
```json
[
  {
    "id": "clx...",
    "name": "Warehouse A",
    "description": "Main distribution center",
    "type": "circle",
    "coordinates": "{\"lat\":37.7749,\"lng\":-122.4194,\"radius\":500}",
    "color": "#3B82F6",
    "alertOnEntry": true,
    "alertOnExit": true,
    "status": "active",
    "_count": {
      "alerts": 24
    }
  }
]
```

#### POST /api/geofences
Create a geofence.

**Required Roles:** `saas_admin`, `company_admin`, `fleet_manager`

**Request (Circle):**
```json
{
  "name": "Warehouse A",
  "description": "Main distribution center",
  "type": "circle",
  "coordinates": "{\"lat\":37.7749,\"lng\":-122.4194,\"radius\":500}",
  "color": "#3B82F6",
  "alertOnEntry": true,
  "alertOnExit": true
}
```

**Request (Polygon):**
```json
{
  "name": "Delivery Zone",
  "type": "polygon",
  "coordinates": "[{\"lat\":37.7749,\"lng\":-122.4194},{\"lat\":37.7849,\"lng\":-122.4094},{\"lat\":37.7649,\"lng\":-122.3994}]",
  "alertOnEntry": true,
  "alertOnExit": false
}
```

### 8.9 Incident Endpoints

#### GET /api/incidents
List incidents.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `open`, `investigating`, `resolved`, `closed` |
| `type` | string | `accident`, `breakdown`, `theft`, `vandalism`, `traffic_violation` |
| `severity` | string | `minor`, `moderate`, `major`, `critical` |
| `limit` | number | Max results (default 50, max 100) |
| `offset` | number | Skip results |

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "accident",
      "severity": "major",
      "description": "Rear-end collision at intersection",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "location": "Market St & 5th Ave, San Francisco",
      "status": "investigating",
      "reportedAt": "2025-02-01T10:30:00Z",
      "vehicle": {
        "id": "clx...",
        "licensePlate": "ABC-1234",
        "make": "Freightliner",
        "model": "Cascadia"
      },
      "driver": {
        "id": "clx...",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      "videos": [
        {
          "id": "clx...",
          "filename": "dashcam_20250201_103000.mp4",
          "status": "ready",
          "thumbnailUrl": "https://..."
        }
      ]
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST /api/incidents
Report a new incident.

**Request:**
```json
{
  "type": "accident",
  "severity": "major",
  "description": "Rear-end collision at intersection",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "location": "Market St & 5th Ave, San Francisco",
  "vehicleId": "clx...",
  "driverId": "clx..."
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `type` | Required, enum: `accident`, `breakdown`, `theft`, `vandalism`, `traffic_violation` |
| `severity` | Required, enum: `minor`, `moderate`, `major`, `critical` |
| `description` | Required, 1-2000 characters |
| `latitude` | Required, -90 to 90 |
| `longitude` | Required, -180 to 180 |
| `vehicleId` | Optional, valid CUID |
| `driverId` | Optional, valid CUID |

#### PUT /api/incidents/[id]
Update incident status/resolution.

#### DELETE /api/incidents/[id]
Delete incident.

### 8.10 Alert Endpoints

#### GET /api/alerts
List alerts.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unread` | boolean | Filter unread only |
| `severity` | string | `info`, `warning`, `critical` |
| `type` | string | `geofence`, `speeding`, `maintenance`, `eld_violation`, `safety`, `system` |
| `limit` | number | Max results (default 50) |
| `offset` | number | Skip results |

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "geofence",
      "severity": "info",
      "title": "Vehicle entered Warehouse A",
      "message": "ABC-1234 entered geofence Warehouse A at 10:30 AM",
      "read": false,
      "acknowledged": false,
      "createdAt": "2025-02-01T10:30:00Z",
      "geofence": {
        "id": "clx...",
        "name": "Warehouse A"
      }
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### PATCH /api/alerts
Mark alerts as read or acknowledged.

**Request:**
```json
{
  "alertIds": ["clx...", "clx..."],
  "action": "read"
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| `read` | Mark as read |
| `acknowledge` | Mark as acknowledged |

### 8.11 Analytics Endpoints

#### GET /api/analytics
Get fleet analytics dashboard data.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | number | 30 | Days to analyze (1-365) |

**Response:**
```json
{
  "tripStats": {
    "_sum": {
      "distance": 125000.5,
      "fuelUsed": 18750.2,
      "duration": 187500,
      "idleTime": 12500
    },
    "_avg": {
      "avgSpeed": 55.3,
      "fuelUsed": 45.2
    },
    "_count": 415
  },
  "safetyEvents": [
    { "type": "harsh_braking", "_count": 45 },
    { "type": "speeding", "_count": 23 },
    { "type": "lane_departure", "_count": 12 }
  ],
  "fuelRecords": [...],
  "maintenanceRecords": {
    "_sum": { "cost": 45000.00 },
    "_count": 28
  },
  "driverStats": [
    {
      "id": "clx...",
      "safetyScore": 98.5,
      "totalMiles": 12500,
      "totalTrips": 65,
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "_count": { "safetyEvents": 3 }
    }
  ],
  "vehicleCount": 45,
  "tripTrends": [
    { "status": "completed", "_count": 380 },
    { "status": "in_progress", "_count": 15 },
    { "status": "cancelled", "_count": 20 }
  ]
}
```

### 8.12 Admin Endpoints

**Required Roles:** `saas_admin`, `company_admin`

#### GET /api/admin/users
List all users (SaaS admin sees all, company admin sees own org).

#### POST /api/admin/users
Create a user.

**Request:**
```json
{
  "email": "new.user@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "555-987-6543",
  "role": "fleet_manager",
  "organizationId": "clx..."
}
```

**Note:** Creates user with default password `user123`.

**Privilege Restrictions:**
- `company_admin` cannot create SaaS-level users
- `company_admin` cannot create users in other organizations

#### PUT /api/admin/users/[id]
Update user.

#### DELETE /api/admin/users/[id]
Delete user.

#### GET /api/admin/organizations
List organizations (SaaS admin only).

#### POST /api/admin/organizations
Create organization.

#### PUT /api/admin/organizations/[id]
Update organization.

#### DELETE /api/admin/organizations/[id]
Delete organization.

### 8.13 Settings Endpoints

#### GET /api/settings/profile
Get current user profile.

#### PUT /api/settings/profile
Update profile.

#### POST /api/settings/password
Change password.

**Request:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

#### GET /api/settings/preferences
Get user preferences.

#### PUT /api/settings/preferences
Update preferences.

**Request:**
```json
{
  "darkMode": true,
  "distanceUnit": "miles",
  "timezone": "America/Los_Angeles",
  "dateFormat": "MM/DD/YYYY",
  "mapView": "satellite",
  "autoRefresh": true
}
```

#### GET /api/settings/notifications
Get notification settings.

#### PUT /api/settings/notifications
Update notification settings.

#### GET /api/settings/two-factor
Get 2FA status.

#### POST /api/settings/two-factor
Enable/disable 2FA.

### 8.14 Utility Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-01T10:30:00Z"
}
```

#### POST /api/seed
Seed database with sample data (development only).

#### GET /api/csrf
Get CSRF token.

#### POST /api/simulator
Start/stop vehicle simulator.

**Request:**
```json
{
  "action": "start",
  "vehicleIds": ["clx...", "clx..."]
}
```

---

## 9. Rate Limiting

### 9.1 Rate Limit Types

| Type | Limit | Window | Use Case |
|------|-------|--------|----------|
| `api` | 100 requests | 60 seconds | General API calls |
| `auth` | 10 requests | 60 seconds | Login attempts |
| `sensitive` | 5 requests | 60 seconds | Password changes, 2FA |

### 9.2 Configuration

**Environment Variables:**
```env
# Custom rate limits
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Upstash Redis (production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Fallback:** Uses in-memory rate limiting when Redis is not configured.

### 9.3 Response Headers

Rate limit information is included in response headers:

```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-02-01T10:31:00Z
Retry-After: 45  (only when limited)
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Too many requests",
  "retryAfter": 45,
  "message": "Rate limit exceeded. Please try again in 45 seconds."
}
```
**Status:** `429 Too Many Requests`

---

## 10. Error Handling

### 10.1 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### 10.2 Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

### 10.3 Validation Errors

Zod validation errors include detailed field information:

```json
{
  "error": "Invalid data",
  "details": [
    {
      "code": "too_small",
      "minimum": 17,
      "type": "string",
      "inclusive": true,
      "exact": true,
      "message": "String must contain exactly 17 character(s)",
      "path": ["vin"]
    },
    {
      "code": "invalid_enum_value",
      "options": ["truck", "van", "car", "trailer"],
      "received": "boat",
      "path": ["type"],
      "message": "Invalid enum value"
    }
  ]
}
```

---

## 11. API Handler Pattern

### 11.1 createApiHandler Utility

The `createApiHandler` wrapper provides consistent handling for:
- Rate limiting
- Authentication
- Role-based authorization
- Error handling
- Logging

**Location:** `src/lib/apiUtils.ts`

```typescript
interface ApiHandlerOptions {
  requireAuth?: boolean;     // Default: true
  allowedRoles?: string[];   // Optional role restriction
  rateLimit?: RateLimitType; // 'api' | 'auth' | 'sensitive'
  logContext?: string;       // Logging context name
}

function createApiHandler(
  handler: ApiHandler,
  options?: ApiHandlerOptions
): (request: Request) => Promise<NextResponse>;
```

### 11.2 Usage Example

```typescript
import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/apiUtils";
import { prisma } from "@/lib/db";

export const GET = createApiHandler(
  async (request, { session, log }) => {
    log.info("Fetching data");

    const data = await prisma.vehicle.findMany({
      where: { organizationId: session.user.organizationId },
    });

    return NextResponse.json(data);
  },
  {
    requireAuth: true,
    allowedRoles: ["saas_admin", "company_admin", "fleet_manager"],
    rateLimit: "api",
    logContext: "vehicles",
  }
);

export const POST = createApiHandler(
  async (request, { session, log }) => {
    const body = await request.json();
    // Validation and creation logic...
    return NextResponse.json(result, { status: 201 });
  },
  {
    requireAuth: true,
    allowedRoles: ["saas_admin", "company_admin"],
    rateLimit: "sensitive",
  }
);
```

---

## 12. Testing

### 12.1 Test Structure

```
src/__tests__/
├── api/
│   ├── admin-users.test.ts
│   ├── alerts.test.ts
│   ├── analytics.test.ts
│   ├── drivers.test.ts
│   ├── eld.test.ts
│   ├── geofences.test.ts
│   ├── incidents.test.ts
│   ├── settings.test.ts
│   ├── simulator.test.ts
│   ├── tracking.test.ts
│   └── trips.test.ts
│
e2e/
├── api.spec.ts
├── auth.spec.ts
└── dashboard.spec.ts
```

### 12.2 Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running server)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

---

## 13. Deployment

### 13.1 Vercel Deployment

1. Push to GitHub repository
2. Connect to Vercel
3. Configure environment variables
4. Deploy

**Build Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### 13.2 Environment Variables

**Required for Production:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random 32+ character string |
| `AUTH_URL` | Production URL (https://...) |
| `NEXTAUTH_URL` | Same as AUTH_URL |

**Recommended:**

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Redis for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |
| `SENTRY_DSN` | Error tracking |

---

## 14. Best Practices

### 14.1 Code Style

- Use TypeScript strictly (`strict: true`)
- Follow ESLint rules
- Use Prettier for formatting
- Prefer named exports
- Use async/await over Promises

### 14.2 Security Guidelines

1. **Never expose secrets** in client code
2. **Validate all input** using Zod schemas
3. **Use parameterized queries** (Prisma handles this)
4. **Implement rate limiting** on all endpoints
5. **Check user roles** before sensitive operations
6. **Filter by organizationId** for multi-tenant queries
7. **Hash passwords** with bcrypt (min 12 rounds)
8. **Use HTTPS** in production
9. **Set secure cookie flags** for sessions
10. **Audit sensitive operations** using AuditLog

### 14.3 API Development

1. Always use `createApiHandler` wrapper
2. Define Zod schemas for request validation
3. Return consistent response formats
4. Use appropriate HTTP status codes
5. Include pagination for list endpoints
6. Log operations with context
7. Handle errors gracefully
8. Document new endpoints in this guide

---

## Appendix A: Common Tasks

### Adding a New API Endpoint

1. Create route file: `src/app/api/[resource]/route.ts`
2. Define Zod validation schema
3. Implement GET/POST handlers with `createApiHandler`
4. Add types to `src/types/api.types.ts`
5. Update this documentation

### Adding a New Database Model

1. Define model in `prisma/schema.prisma`
2. Add appropriate indexes
3. Run `npx prisma db push` or create migration
4. Generate client: `npx prisma generate`
5. Create TypeScript interface in `src/types/models/`
6. Update this documentation

### Adding a New Dashboard Page

1. Create page: `src/app/(dashboard)/[feature]/page.tsx`
2. Add route to Sidebar: `src/components/dashboard/Sidebar.tsx`
3. Create necessary components
4. Implement API calls

---

*Document Version: 2.0*
*Last Updated: February 2025*
*Maintained by: Development Team*
