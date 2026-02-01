#!/usr/bin/env python3
"""
Fix diagrams for FleetTrack Pro SoW
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def create_data_flow_diagram():
    """Create data flow diagram with proper spacing"""
    fig, ax = plt.subplots(1, 1, figsize=(18, 14))
    ax.set_xlim(0, 18)
    ax.set_ylim(-1, 14)
    ax.axis('off')
    ax.set_facecolor('#FAFAFA')
    fig.patch.set_facecolor('#FAFAFA')

    colors = {
        'user': '#4A90D9',
        'frontend': '#50C878',
        'api': '#FF8C42',
        'auth': '#9B59B6',
        'database': '#E74C3C',
        'external': '#7F8C8D',
        'arrow': '#2C3E50'
    }

    # Title
    ax.text(9, 13.3, 'FleetTrack Pro - Data Flow Diagram', fontsize=20, fontweight='bold',
            ha='center', va='center', color='#2C3E50')

    def draw_box(x, y, w, h, color, label, sublabel=None):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05,rounding_size=0.2",
                             facecolor=color, edgecolor='#2C3E50', linewidth=2, alpha=0.9)
        ax.add_patch(box)
        if sublabel:
            ax.text(x + w/2, y + h/2 + 0.2, label, fontsize=11, fontweight='bold',
                    ha='center', va='center', color='white')
            ax.text(x + w/2, y + h/2 - 0.2, sublabel, fontsize=8,
                    ha='center', va='center', color='white', alpha=0.9)
        else:
            ax.text(x + w/2, y + h/2, label, fontsize=11, fontweight='bold',
                    ha='center', va='center', color='white')

    def draw_arrow(start, end, label=None, color='#2C3E50', curve=0):
        style = "Simple,tail_width=0.5,head_width=4,head_length=6"
        connectionstyle = f"arc3,rad={curve}" if curve != 0 else "arc3,rad=0"
        arrow = FancyArrowPatch(start, end, arrowstyle=style, color=color,
                                connectionstyle=connectionstyle, linewidth=1.5, alpha=0.7)
        ax.add_patch(arrow)
        if label:
            mid_x = (start[0] + end[0]) / 2 + (curve * 2)
            mid_y = (start[1] + end[1]) / 2 + (0.35 if curve == 0 else curve * 1.5)
            ax.text(mid_x, mid_y, label, fontsize=8, ha='center', va='center',
                    color='#2C3E50', style='italic',
                    bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.9, edgecolor='#BDC3C7'))

    # Layer labels
    ax.text(0.3, 11.8, 'USERS', fontsize=9, fontweight='bold', color='#7F8C8D', ha='left')
    ax.text(0.3, 8.8, 'FRONTEND', fontsize=9, fontweight='bold', color='#7F8C8D', ha='left')
    ax.text(0.3, 5.8, 'API LAYER', fontsize=9, fontweight='bold', color='#7F8C8D', ha='left')
    ax.text(0.3, 3.0, 'SERVICES', fontsize=9, fontweight='bold', color='#7F8C8D', ha='left')
    ax.text(0.3, 0.3, 'DATABASE', fontsize=9, fontweight='bold', color='#7F8C8D', ha='left')

    # Layer 1: Users (y=10.5 to 12)
    draw_box(1.5, 10.5, 3, 1.3, colors['user'], 'Fleet Manager', 'Web Browser')
    draw_box(5.5, 10.5, 3, 1.3, colors['user'], 'Driver', 'Mobile/Web')
    draw_box(9.5, 10.5, 3, 1.3, colors['user'], 'Admin', 'Web Portal')
    draw_box(14, 10.5, 3, 1.3, colors['external'], 'IoT Devices', 'GPS/ELD/OBD')

    # Layer 2: Frontend (y=7.5 to 9)
    draw_box(3, 7.5, 8, 1.5, colors['frontend'], 'Next.js Frontend', 'React 19 + Tailwind CSS + Leaflet Maps + Recharts')

    # Layer 3: API & Auth (y=4.5 to 6)
    draw_box(1, 4.5, 3.5, 1.5, colors['auth'], 'NextAuth', 'JWT Sessions')
    draw_box(5.5, 4.5, 5, 1.5, colors['api'], 'REST API Layer', 'Rate Limiting + Zod Validation')
    draw_box(11.5, 4.5, 4, 1.5, colors['api'], 'API Routes', '30+ Endpoints')

    # Layer 4: Services (y=1.8 to 3.3)
    draw_box(0.5, 1.8, 2.8, 1.5, colors['auth'], 'Auth Service', 'RBAC + Audit')
    draw_box(3.7, 1.8, 2.8, 1.5, colors['api'], 'Fleet Service', 'Vehicles/Drivers')
    draw_box(6.9, 1.8, 2.8, 1.5, colors['api'], 'Tracking', 'Real-time GPS')
    draw_box(10.1, 1.8, 2.8, 1.5, colors['api'], 'Analytics', 'Metrics/Reports')
    draw_box(13.3, 1.8, 2.8, 1.5, colors['api'], 'Compliance', 'ELD/DOT Logs')

    # Database (y=-0.5 to 0.8)
    draw_box(4.5, -0.5, 9, 1.5, colors['database'], 'PostgreSQL Database', 'Prisma ORM - 24 Tables - Indexed for Performance')

    # Arrows: Users to Frontend
    draw_arrow((3, 10.5), (5, 9), 'HTTP/HTTPS')
    draw_arrow((7, 10.5), (7, 9), 'HTTP/HTTPS')
    draw_arrow((11, 10.5), (9, 9), 'HTTP/HTTPS')

    # IoT to API
    draw_arrow((15.5, 10.5), (13.5, 6), 'Telemetry', curve=-0.2)

    # Frontend to API/Auth
    draw_arrow((5, 7.5), (2.75, 6), 'Auth')
    draw_arrow((7, 7.5), (8, 6), 'API Calls')

    # Auth to Service
    draw_arrow((2.75, 4.5), (1.9, 3.3), 'Validate')

    # API to Services
    draw_arrow((6.5, 4.5), (5.1, 3.3), 'CRUD')
    draw_arrow((8.5, 4.5), (8.3, 3.3), 'Query')
    draw_arrow((11.5, 4.8), (11.5, 3.3), 'Aggregate')
    draw_arrow((13.5, 4.5), (14.7, 3.3), 'Logs')

    # Services to Database
    draw_arrow((1.9, 1.8), (6, 1), 'R/W', curve=0.15)
    draw_arrow((5.1, 1.8), (7.5, 1), 'CRUD')
    draw_arrow((8.3, 1.8), (9, 1), 'Query')
    draw_arrow((11.5, 1.8), (10.5, 1), 'Agg', curve=-0.1)
    draw_arrow((14.7, 1.8), (12, 1), 'Logs', curve=-0.15)

    # Legend
    legend_y = 12.5
    legend_x = 14.5
    ax.add_patch(Rectangle((legend_x, legend_y - 2.2), 3.3, 2.5, facecolor='white', edgecolor='#BDC3C7', alpha=0.9, linewidth=1))
    ax.text(legend_x + 1.65, legend_y + 0.1, 'Legend', fontsize=9, fontweight='bold', ha='center', color='#2C3E50')

    legend_items = [
        (colors['user'], 'Users/Clients'),
        (colors['frontend'], 'Frontend'),
        (colors['api'], 'API/Services'),
        (colors['auth'], 'Authentication'),
        (colors['database'], 'Database'),
        (colors['external'], 'External'),
    ]

    for i, (color, label) in enumerate(legend_items):
        row = i // 2
        col = i % 2
        x = legend_x + 0.15 + col * 1.6
        y = legend_y - 0.5 - row * 0.55
        ax.add_patch(Rectangle((x, y), 0.35, 0.35, facecolor=color, edgecolor='#2C3E50', linewidth=1))
        ax.text(x + 0.45, y + 0.17, label, fontsize=7, va='center', color='#2C3E50')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'data_flow_diagram.png'), dpi=150, bbox_inches='tight',
                facecolor='#FAFAFA', edgecolor='none', pad_inches=0.3)
    plt.close()
    print("Created: data_flow_diagram.png")


def create_architecture_diagram():
    """Create software architecture diagram with no overlapping"""
    fig, ax = plt.subplots(1, 1, figsize=(20, 16))
    ax.set_xlim(0, 20)
    ax.set_ylim(-1, 16)
    ax.axis('off')
    ax.set_facecolor('#FAFAFA')
    fig.patch.set_facecolor('#FAFAFA')

    colors = {
        'presentation': '#3498DB',
        'application': '#2ECC71',
        'business': '#F39C12',
        'data': '#E74C3C',
        'infrastructure': '#9B59B6',
        'external': '#7F8C8D',
    }

    # Title
    ax.text(10, 15.3, 'FleetTrack Pro - Software Architecture', fontsize=22, fontweight='bold',
            ha='center', va='center', color='#2C3E50')
    ax.text(10, 14.7, 'Multi-Tenant SaaS Fleet Management Platform', fontsize=13,
            ha='center', va='center', color='#7F8C8D', style='italic')

    def draw_layer(y, height, color, label):
        box = FancyBboxPatch((0.5, y), 19, height, boxstyle="round,pad=0.02,rounding_size=0.1",
                             facecolor=color, edgecolor='#2C3E50', linewidth=2, alpha=0.12)
        ax.add_patch(box)
        ax.text(0.8, y + height - 0.35, label, fontsize=11, fontweight='bold',
                ha='left', va='top', color='#2C3E50')

    def draw_component(x, y, w, h, color, label, items=None):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.03,rounding_size=0.15",
                             facecolor=color, edgecolor='#2C3E50', linewidth=1.5, alpha=0.9)
        ax.add_patch(box)

        if items:
            ax.text(x + w/2, y + h - 0.3, label, fontsize=10, fontweight='bold',
                    ha='center', va='top', color='white')
            for i, item in enumerate(items):
                ax.text(x + w/2, y + h - 0.6 - (i * 0.28), f"- {item}", fontsize=7,
                        ha='center', va='top', color='white', alpha=0.95)
        else:
            ax.text(x + w/2, y + h/2, label, fontsize=10, fontweight='bold',
                    ha='center', va='center', color='white')

    # Layer 1: Presentation (y=12 to 14)
    draw_layer(12, 2.2, colors['presentation'], 'PRESENTATION LAYER')
    draw_component(1.2, 12.3, 2.8, 1.6, colors['presentation'], 'Dashboard', ['Stats Cards', 'Quick Actions'])
    draw_component(4.3, 12.3, 2.8, 1.6, colors['presentation'], 'Live Tracking', ['Leaflet Maps', 'Real-time'])
    draw_component(7.4, 12.3, 2.8, 1.6, colors['presentation'], 'Fleet Mgmt', ['Vehicles', 'Drivers'])
    draw_component(10.5, 12.3, 2.8, 1.6, colors['presentation'], 'ELD Compliance', ['HOS Logs', 'Certification'])
    draw_component(13.6, 12.3, 2.8, 1.6, colors['presentation'], 'Analytics', ['Charts', 'Reports'])
    draw_component(16.7, 12.3, 2.5, 1.6, colors['presentation'], 'Admin Panel', ['Orgs', 'Users'])

    # Layer 2: Application (y=9 to 11.5)
    draw_layer(9, 2.7, colors['application'], 'APPLICATION LAYER (Next.js 16)')
    draw_component(1.2, 9.35, 3.5, 2, colors['application'], 'React Components', ['UI Library', 'Zustand State', 'React Query'])
    draw_component(5, 9.35, 3.5, 2, colors['application'], 'Page Router', ['App Router', 'Middleware', 'Layouts'])
    draw_component(8.8, 9.35, 3.5, 2, colors['application'], 'API Routes', ['REST Endpoints', 'Rate Limiting', 'Zod Validation'])
    draw_component(12.6, 9.35, 3.5, 2, colors['application'], 'Auth (NextAuth)', ['JWT Sessions', 'RBAC', 'Credentials'])
    draw_component(16.4, 9.35, 3, 2, colors['application'], 'Error Handling', ['Sentry', 'Pino Logging'])

    # Layer 3: Business Logic (y=6 to 8.5)
    draw_layer(6, 2.7, colors['business'], 'BUSINESS LOGIC LAYER')
    draw_component(1.2, 6.35, 2.6, 2, colors['business'], 'Fleet Mgmt', ['Vehicle CRUD', 'Driver CRUD'])
    draw_component(4.1, 6.35, 2.6, 2, colors['business'], 'Tracking', ['GPS Processing', 'Telemetry'])
    draw_component(7, 6.35, 2.6, 2, colors['business'], 'Trip Service', ['Route Planning', 'Trip Logging'])
    draw_component(9.9, 6.35, 2.6, 2, colors['business'], 'ELD Service', ['HOS Tracking', 'Certification'])
    draw_component(12.8, 6.35, 2.6, 2, colors['business'], 'Safety', ['Incidents', 'Alerts'])
    draw_component(15.7, 6.35, 2.1, 2, colors['business'], 'Analytics', ['Aggregation'])
    draw_component(18.1, 6.35, 1.3, 2, colors['business'], 'Geo', ['Zones'])

    # Layer 4: Data Access (y=3.2 to 5.5)
    draw_layer(3.2, 2.5, colors['data'], 'DATA ACCESS LAYER')
    draw_component(1.2, 3.55, 4, 1.8, colors['data'], 'Prisma ORM', ['Type-safe Queries', 'Migrations'])
    draw_component(5.5, 3.55, 4, 1.8, colors['data'], 'Repository Pattern', ['CRUD Operations', 'Transactions'])
    draw_component(9.8, 3.55, 4, 1.8, colors['data'], 'Query Builders', ['Filters', 'Pagination', 'Sorting'])
    draw_component(14.1, 3.55, 5.3, 1.8, colors['data'], 'Data Models (24 Tables)', ['Orgs, Users, Vehicles', 'Drivers, Trips, ELD...'])

    # Layer 5: Infrastructure (y=0.3 to 2.8)
    draw_layer(0.3, 2.6, colors['infrastructure'], 'INFRASTRUCTURE LAYER')
    draw_component(1.2, 0.65, 3.2, 1.9, colors['infrastructure'], 'PostgreSQL', ['Primary Database', 'Performance Indexes'])
    draw_component(4.7, 0.65, 3.2, 1.9, colors['infrastructure'], 'Vercel', ['Serverless Deploy', 'Edge Network'])
    draw_component(8.2, 0.65, 3.2, 1.9, colors['infrastructure'], 'Security', ['Rate Limiting', 'CORS Headers'])
    draw_component(11.7, 0.65, 3.2, 1.9, colors['infrastructure'], 'Monitoring', ['Audit Logs', 'Sentry Tracking'])
    draw_component(15.2, 0.65, 2.3, 1.9, colors['external'], 'IoT', ['GPS Devices', 'ELD Units'])
    draw_component(17.8, 0.65, 1.6, 1.9, colors['external'], 'Maps', ['Leaflet'])

    # Vertical connection lines between layers
    def draw_connection(x, y1, y2):
        ax.plot([x, x], [y1, y2], color='#95A5A6', linewidth=1.5, alpha=0.4, linestyle='--')

    # Connections Presentation -> Application
    for x in [2.6, 5.7, 8.8, 11.9, 15, 17.95]:
        draw_connection(x, 12.3, 11.5)

    # Connections Application -> Business
    for x in [2.95, 6.75, 10.55, 14.35, 17.9]:
        draw_connection(x, 9.35, 8.7)

    # Connections Business -> Data
    for x in [2.5, 5.4, 8.3, 11.2, 14.1, 16.75, 18.75]:
        draw_connection(x, 6.35, 5.7)

    # Connections Data -> Infrastructure
    for x in [3.2, 7.5, 11.8, 16.75]:
        draw_connection(x, 3.55, 2.9)

    # Legend at bottom
    ax.text(1, -0.6, 'Architecture Layers:', fontsize=10, fontweight='bold', color='#2C3E50')
    legend_items = [
        (colors['presentation'], 'Presentation'),
        (colors['application'], 'Application'),
        (colors['business'], 'Business Logic'),
        (colors['data'], 'Data Access'),
        (colors['infrastructure'], 'Infrastructure'),
        (colors['external'], 'External Services')
    ]

    for i, (color, label) in enumerate(legend_items):
        x = 5 + i * 2.5
        ax.add_patch(Rectangle((x, -0.75), 0.4, 0.4, facecolor=color, edgecolor='#2C3E50', alpha=0.9, linewidth=1))
        ax.text(x + 0.5, -0.55, label, fontsize=9, va='center', color='#2C3E50')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'architecture_diagram.png'), dpi=150, bbox_inches='tight',
                facecolor='#FAFAFA', edgecolor='none', pad_inches=0.3)
    plt.close()
    print("Created: architecture_diagram.png")


def main():
    print("Fixing diagrams...")
    print("-" * 40)

    print("\n1. Recreating Data Flow Diagram...")
    create_data_flow_diagram()

    print("\n2. Recreating Architecture Diagram...")
    create_architecture_diagram()

    print("\n" + "=" * 40)
    print("Diagrams fixed!")
    print("=" * 40)


if __name__ == "__main__":
    main()
