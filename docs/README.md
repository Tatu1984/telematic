# FleetTrack Pro Documentation

Welcome to the FleetTrack Pro documentation.

## Available Guides

### For Developers

📘 **[Developer Guide](./DEVELOPER_GUIDE.md)**

Complete technical documentation including:
- Project structure and architecture
- API reference (all endpoints)
- Authentication and authorization
- Database schema
- Development setup
- Best practices

### For Users

📗 **[User Manual](./USER_MANUAL.md)**

End-user documentation including:
- Getting started guide
- Feature walkthroughs
- Step-by-step instructions
- Troubleshooting tips
- Keyboard shortcuts

---

## Quick Links

### API Endpoints Summary

| Category | Endpoints |
|----------|-----------|
| Vehicles | `/api/vehicles`, `/api/vehicles/[id]` |
| Drivers | `/api/drivers`, `/api/drivers/[id]` |
| Tracking | `/api/tracking` |
| ELD | `/api/eld`, `/api/eld/status`, `/api/eld/certify` |
| Geofences | `/api/geofences`, `/api/geofences/[id]` |
| Incidents | `/api/incidents`, `/api/incidents/[id]` |
| Alerts | `/api/alerts` |
| Analytics | `/api/analytics` |
| Admin | `/api/admin/users`, `/api/admin/organizations` |
| Settings | `/api/settings/*` |

### Project Structure

```
src/
├── app/           # Next.js pages and API routes
├── components/    # React components
├── config/        # Configuration files
├── lib/           # Core utilities and API client
├── services/      # Business logic layer
├── types/         # TypeScript type definitions
└── styles/        # CSS and themes
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| SaaS Admin | admin@fleettrack.com | FleetTrack2024! |
| Company Admin | admin@acmetrucking.com | FleetTrack2024! |
| Fleet Manager | fleet@acmetrucking.com | FleetTrack2024! |
| Driver | driver@acmetrucking.com | FleetTrack2024! |

---

## Getting Help

- **Developers**: Check the [Developer Guide](./DEVELOPER_GUIDE.md) or review code comments
- **Users**: See the [User Manual](./USER_MANUAL.md) or contact support
- **Issues**: Create an issue in the repository

---

*FleetTrack Pro - Telematics Platform for Fleet Management*
