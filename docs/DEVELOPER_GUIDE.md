# FleetTrack Pro - Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Architecture](#architecture)
6. [API Reference](#api-reference)
7. [Authentication](#authentication)
8. [Database Schema](#database-schema)
9. [State Management](#state-management)
10. [Styling](#styling)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Best Practices](#best-practices)

---

## Project Overview

FleetTrack Pro is a comprehensive telematics platform for fleet management. It provides real-time vehicle tracking, driver management, ELD (Electronic Logging Device) compliance, geofencing, incident reporting, and analytics.

### Key Features
- Real-time GPS tracking
- Driver Hours of Service (HOS) management
- ELD compliance (DOT regulations)
- Geofence management
- Incident reporting and tracking
- Fleet analytics and reporting
- Multi-tenant architecture (SaaS + Company users)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js v5 |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel |
| **State** | React hooks + Context |

---

## Project Structure

```
telematics/
├── public/
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login)
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── tracking/             # Live vehicle tracking
│   │   │   ├── vehicles/             # Vehicle management
│   │   │   ├── drivers/              # Driver management
│   │   │   ├── eld/                  # ELD logs & compliance
│   │   │   ├── geofences/            # Geofence management
│   │   │   ├── incidents/            # Incident reporting
│   │   │   ├── analytics/            # Fleet analytics
│   │   │   ├── admin/                # Admin panel (SaaS users)
│   │   │   ├── settings/             # User settings
│   │   │   └── layout.tsx            # Dashboard layout with sidebar
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # Auth endpoints
│   │   │   ├── vehicles/             # Vehicle CRUD
│   │   │   ├── drivers/              # Driver CRUD
│   │   │   ├── tracking/             # GPS tracking data
│   │   │   ├── eld/                  # ELD operations
│   │   │   ├── geofences/            # Geofence CRUD
│   │   │   ├── incidents/            # Incident CRUD
│   │   │   ├── alerts/               # Alert management
│   │   │   ├── analytics/            # Analytics data
│   │   │   ├── trips/                # Trip data
│   │   │   ├── admin/                # Admin operations
│   │   │   ├── settings/             # User settings
│   │   │   └── health/               # Health check
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page (redirects)
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── DropdownMenu.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── common/                   # Shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── dashboard/
│   │   │   ├── tracking/
│   │   │   ├── vehicles/
│   │   │   └── ...
│   │   │
│   │   ├── layouts/                  # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── dashboard/                # Legacy dashboard components
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       ├── StatsCard.tsx
│   │       └── QuickActionCards.tsx
│   │
│   ├── lib/                          # Core utilities
│   │   ├── api/                      # API client abstraction
│   │   │   ├── client.ts             # HTTP client
│   │   │   ├── endpoints.ts          # API endpoint definitions
│   │   │   ├── interceptors.ts       # Request/response interceptors
│   │   │   ├── types.ts              # API types
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                     # Auth utilities
│   │   │   ├── session.ts            # Session helpers
│   │   │   ├── token-manager.ts      # Token management
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── format.ts             # Formatting helpers
│   │   │   ├── validation.ts         # Validation helpers
│   │   │   ├── date.ts               # Date utilities
│   │   │   └── index.ts
│   │   │
│   │   ├── websocket/                # WebSocket client
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── db.ts                     # Prisma client
│   │   ├── apiUtils.ts               # API handler utilities
│   │   ├── rateLimit.ts              # Rate limiting
│   │   ├── logger.ts                 # Logging
│   │   └── env.ts                    # Environment validation
│   │
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── vehicle.service.ts
│   │   ├── driver.service.ts
│   │   ├── tracking.service.ts
│   │   ├── eld.service.ts
│   │   ├── geofence.service.ts
│   │   ├── incident.service.ts
│   │   ├── alert.service.ts
│   │   ├── analytics.service.ts
│   │   ├── admin.service.ts
│   │   ├── trip.service.ts
│   │   └── index.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── api.config.ts             # API settings
│   │   ├── app.config.ts             # App settings
│   │   ├── env.config.ts             # Environment config
│   │   ├── routes.config.ts          # Route definitions
│   │   └── index.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── models/                   # Domain models
│   │   │   ├── User.ts
│   │   │   ├── Vehicle.ts
│   │   │   ├── Driver.ts
│   │   │   ├── ELD.ts
│   │   │   ├── Geofence.ts
│   │   │   ├── Incident.ts
│   │   │   ├── Alert.ts
│   │   │   ├── Trip.ts
│   │   │   ├── Telemetry.ts
│   │   │   ├── Analytics.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── api.types.ts              # API request/response types
│   │   └── index.ts                  # Re-exports all types
│   │
│   ├── styles/                       # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── useCsrf.ts
│   │
│   └── middleware.ts                 # Next.js middleware
│
├── prisma/
│   └── schema.prisma                 # Database schema
│
├── docs/                             # Documentation
│   ├── DEVELOPER_GUIDE.md
│   └── USER_MANUAL.md
│
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Neon account)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd telematics

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your values (see Environment Variables section)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
curl -X POST http://localhost:3000/api/seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/fleettrack"

# Authentication
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting (optional for dev)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Error Tracking (optional)
SENTRY_DSN=""
```

---

## Architecture

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer                                │
│         (React Components, Pages, Layouts)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                             │
│    (Business logic, API consumption, data transformation)    │
│         src/services/*.service.ts                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Client Layer                           │
│         (HTTP client, interceptors, error handling)          │
│                  src/lib/api/                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes Layer                           │
│              (Next.js API handlers)                          │
│                  src/app/api/                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│              (Prisma ORM, PostgreSQL)                        │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → React Component
2. **Component** → Service function (e.g., `vehicleService.getVehicles()`)
3. **Service** → API Client (`apiClient.get()`)
4. **API Client** → Next.js API Route
5. **API Route** → Prisma → Database
6. **Response** flows back through layers

---

## API Reference

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://telematics.tensparrows.com/api`

### Authentication
All protected endpoints require a valid session. Authentication is handled via NextAuth.js cookies.

---

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | Sign in with credentials |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Get current session |

---

### Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all vehicles |
| GET | `/api/vehicles/[id]` | Get vehicle by ID |
| POST | `/api/vehicles` | Create vehicle |
| PUT | `/api/vehicles/[id]` | Update vehicle |
| DELETE | `/api/vehicles/[id]` | Delete vehicle |

**Query Parameters (GET /api/vehicles):**
- `status` - Filter by status (active, inactive, maintenance)
- `type` - Filter by type (truck, van, car, trailer)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Request Body (POST/PUT):**
```json
{
  "vin": "1HGCM82633A123456",
  "licensePlate": "ABC-1234",
  "make": "Freightliner",
  "model": "Cascadia",
  "year": 2023,
  "type": "truck",
  "fuelType": "diesel",
  "status": "active"
}
```

---

### Drivers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all drivers |
| GET | `/api/drivers/[id]` | Get driver by ID |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/[id]` | Update driver |
| DELETE | `/api/drivers/[id]` | Delete driver |

**Request Body (POST/PUT):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "phone": "555-123-4567",
  "licenseNumber": "D1234567",
  "licenseState": "CA",
  "licenseExpiry": "2025-12-31"
}
```

---

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking` | Get live tracking data for all vehicles |

**Response:**
```json
{
  "vehicles": [
    {
      "id": "vehicle-id",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "speed": 65,
        "heading": 180
      },
      "driver": { "id": "...", "name": "John Doe" },
      "status": "driving",
      "lastUpdate": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### ELD (Electronic Logging Device)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/eld` | Get ELD logs (with date filter) |
| GET | `/api/eld/status` | Get current HOS status for all drivers |
| POST | `/api/eld/status` | Update driver duty status |
| POST | `/api/eld/certify` | Certify daily logs |

**ELD Status Types:**
- `off_duty` - Off Duty
- `sleeper_berth` - Sleeper Berth
- `driving` - Driving
- `on_duty_not_driving` - On Duty (Not Driving)

---

### Geofences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/geofences` | List all geofences |
| GET | `/api/geofences/[id]` | Get geofence by ID |
| POST | `/api/geofences` | Create geofence |
| PUT | `/api/geofences/[id]` | Update geofence |
| DELETE | `/api/geofences/[id]` | Delete geofence |

**Geofence Types:**
- `circle` - Circular geofence (center + radius)
- `polygon` - Polygon geofence (array of points)

**Request Body (Circle):**
```json
{
  "name": "Warehouse A",
  "type": "circle",
  "coordinates": {
    "lat": 37.7749,
    "lng": -122.4194,
    "radius": 500
  },
  "alertOnEntry": true,
  "alertOnExit": true
}
```

---

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List all incidents |
| GET | `/api/incidents/[id]` | Get incident by ID |
| POST | `/api/incidents` | Report new incident |
| PUT | `/api/incidents/[id]` | Update incident |
| DELETE | `/api/incidents/[id]` | Delete incident |

**Incident Types:**
- `accident`
- `breakdown`
- `theft`
- `vandalism`
- `traffic_violation`

**Severity Levels:**
- `low`
- `medium`
- `high`
- `critical`

---

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts/[id]/acknowledge` | Acknowledge alert |

---

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get fleet analytics dashboard data |

**Response includes:**
- Fleet statistics
- Active vehicles/drivers
- Trip summaries
- Safety scores
- Fuel usage

---

### Admin (SaaS Users Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/[id]` | Update user |
| DELETE | `/api/admin/users/[id]` | Delete user |
| GET | `/api/admin/organizations` | List organizations |
| POST | `/api/admin/organizations` | Create organization |
| PUT | `/api/admin/organizations/[id]` | Update organization |
| DELETE | `/api/admin/organizations/[id]` | Delete organization |

---

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/profile` | Get user profile |
| PUT | `/api/settings/profile` | Update profile |
| POST | `/api/settings/password` | Change password |
| GET | `/api/settings/preferences` | Get preferences |
| PUT | `/api/settings/preferences` | Update preferences |
| GET | `/api/settings/notifications` | Get notification settings |
| PUT | `/api/settings/notifications` | Update notifications |

---

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/seed` | Seed database (dev only) |
| POST | `/api/simulator` | Start/stop vehicle simulator |

---

## Authentication

### User Roles

**SaaS Roles (Platform Administrators):**
| Role | Description |
|------|-------------|
| `saas_admin` | Full platform access |
| `saas_subscriber_manager` | Manage subscriptions |
| `saas_support` | Customer support access |
| `saas_developer` | Developer access |

**Company Roles (Tenant Users):**
| Role | Description |
|------|-------------|
| `company_admin` | Full company access |
| `fleet_manager` | Manage fleet operations |
| `driver` | Driver-specific access |
| `company_support` | Company support access |

### Role Helpers

```typescript
import {
  isSaaSUser,
  isCompanyUser,
  canManageUsers,
  canManageFleet
} from '@/lib/auth';

// Check role permissions
if (canManageFleet(session.user.role)) {
  // Allow fleet management operations
}
```

### Protected API Routes

```typescript
import { createApiHandler } from '@/lib/apiUtils';

export const GET = createApiHandler(
  async (request, { session, log }) => {
    // session.user is guaranteed to exist
    return NextResponse.json({ data: ... });
  },
  {
    requireAuth: true,
    allowedRoles: ['saas_admin', 'company_admin'],
    rateLimit: 'api',
  }
);
```

---

## Database Schema

### Key Models

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  password       String
  firstName      String
  lastName       String
  role           String    // UserRole
  status         String    @default("active")
  organizationId String?
  organization   Organization? @relation(...)
  lastLogin      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("active")
  users     User[]
  vehicles  Vehicle[]
  drivers   Driver[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Vehicle {
  id             String   @id @default(cuid())
  vin            String   @unique
  licensePlate   String
  make           String
  model          String
  year           Int
  type           String   // VehicleType
  fuelType       String   // FuelType
  status         String   @default("active")
  organizationId String
  organization   Organization @relation(...)
  // ... more fields
}

model Driver {
  id             String   @id @default(cuid())
  firstName      String
  lastName       String
  email          String   @unique
  licenseNumber  String
  licenseState   String
  licenseExpiry  DateTime
  status         String   @default("available")
  organizationId String
  organization   Organization @relation(...)
  eldLogs        ELDLog[]
  // ... more fields
}
```

### Running Migrations

```bash
# Development - push schema changes
npx prisma db push

# Production - create migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

---

## State Management

The application uses React's built-in state management:

### Component State
```typescript
const [vehicles, setVehicles] = useState<Vehicle[]>([]);
const [loading, setLoading] = useState(true);
```

### Server State (API Data)
Data is fetched on page load or via user actions:

```typescript
useEffect(() => {
  async function loadVehicles() {
    const response = await fetch('/api/vehicles');
    const data = await response.json();
    setVehicles(data.vehicles);
  }
  loadVehicles();
}, []);
```

### Using Services Layer (Recommended)

```typescript
import { vehicleService } from '@/services';

// In component
const vehicles = await vehicleService.getVehicles();
```

---

## Styling

### Tailwind CSS
All styling is done with Tailwind CSS utility classes:

```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

### CSS Variables
Custom properties are defined in `src/styles/variables.css`:

```css
:root {
  --color-primary-500: #3b82f6;
  --color-gray-900: #111827;
  /* ... */
}
```

### Dark Mode
Dark mode is supported via Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-900">
```

---

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Test Structure

```
src/__tests__/
├── api/                 # API route tests
│   ├── vehicles.test.ts
│   ├── drivers.test.ts
│   └── ...
└── lib/                 # Utility tests
    ├── auth.test.ts
    └── rateLimit.test.ts
```

---

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Vercel auto-deploys from `main` branch
3. Set environment variables in Vercel dashboard

### Environment Variables for Production

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Random 32-char string
- `AUTH_URL` / `NEXTAUTH_URL` - Production URL

Recommended:
- `UPSTASH_REDIS_REST_URL` - For rate limiting
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN` - For error tracking

---

## Best Practices

### Code Style
- Use TypeScript strictly
- Follow ESLint rules
- Use Prettier for formatting

### API Development
1. Use `createApiHandler` for all API routes
2. Always validate input data
3. Use appropriate HTTP status codes
4. Return consistent response formats

### Component Development
1. Keep components small and focused
2. Use TypeScript interfaces for props
3. Extract reusable logic to hooks
4. Use UI components from `@/components/ui`

### Security
- Never expose secrets in client code
- Validate all user input
- Use parameterized queries (Prisma handles this)
- Implement rate limiting on sensitive endpoints
- Check user roles before sensitive operations

---

## Common Tasks

### Adding a New API Endpoint

1. Create route file in `src/app/api/`
2. Use `createApiHandler` wrapper
3. Add types to `src/types/api.types.ts`
4. Add service function in `src/services/`
5. Update API docs

### Adding a New Page

1. Create folder in `src/app/(dashboard)/`
2. Add `page.tsx` with component
3. Add route to sidebar in `src/components/dashboard/Sidebar.tsx`
4. Add route constant to `src/config/routes.config.ts`

### Adding a New Component

1. Create in appropriate folder:
   - `src/components/ui/` - Base UI components
   - `src/components/common/` - Shared components
   - `src/components/features/[feature]/` - Feature-specific
2. Export from folder's `index.ts`
3. Use TypeScript for props

---

## Support

For questions or issues:
- Check existing documentation
- Review code comments
- Create an issue in the repository

---

*Last Updated: February 2025*
