#!/usr/bin/env python3
"""Fix data flow diagram with clean layout - no overlapping"""

import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle

OUTPUT_DIR = '/Users/sudipto/Desktop/projects/telematics'

def create_data_flow_diagram():
    """Create clean data flow diagram with no overlapping"""
    fig, ax = plt.subplots(1, 1, figsize=(22, 16))
    ax.set_xlim(0, 22)
    ax.set_ylim(0, 16)
    ax.axis('off')
    ax.set_facecolor('#FAFAFA')
    fig.patch.set_facecolor('#FAFAFA')

    colors = {
        'user': '#4A90D9',
        'frontend': '#27AE60',
        'api': '#E67E22',
        'auth': '#8E44AD',
        'database': '#C0392B',
        'external': '#7F8C8D',
    }

    # Title
    ax.text(11, 15.3, 'FleetTrack Pro - Data Flow Diagram', fontsize=26, fontweight='bold',
            ha='center', va='center', color='#2C3E50')

    def draw_box(x, y, w, h, color, label, sublabel=None):
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05,rounding_size=0.3",
                             facecolor=color, edgecolor='#2C3E50', linewidth=2)
        ax.add_patch(box)
        if sublabel:
            ax.text(x + w/2, y + h/2 + 0.25, label, fontsize=13, fontweight='bold',
                    ha='center', va='center', color='white')
            ax.text(x + w/2, y + h/2 - 0.3, sublabel, fontsize=9,
                    ha='center', va='center', color='white', alpha=0.9)
        else:
            ax.text(x + w/2, y + h/2, label, fontsize=13, fontweight='bold',
                    ha='center', va='center', color='white')

    def draw_arrow(start, end, label=None, curve=0):
        style = "Simple,tail_width=0.6,head_width=5,head_length=8"
        connectionstyle = f"arc3,rad={curve}"
        arrow = FancyArrowPatch(start, end, arrowstyle=style, color='#34495E',
                                connectionstyle=connectionstyle, linewidth=1.5, alpha=0.7)
        ax.add_patch(arrow)
        if label:
            mid_x = (start[0] + end[0]) / 2 + (curve * 3)
            mid_y = (start[1] + end[1]) / 2 + (0.4 if curve == 0 else curve * 2)
            ax.text(mid_x, mid_y, label, fontsize=9, ha='center', va='center',
                    color='#2C3E50', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='#BDC3C7', linewidth=1))

    # Layer labels on left
    ax.text(0.5, 13.2, 'USERS', fontsize=12, fontweight='bold', color='#566573', ha='left', va='center')
    ax.text(0.5, 10.3, 'FRONTEND', fontsize=12, fontweight='bold', color='#566573', ha='left', va='center')
    ax.text(0.5, 7.3, 'API LAYER', fontsize=12, fontweight='bold', color='#566573', ha='left', va='center')
    ax.text(0.5, 4.3, 'SERVICES', fontsize=12, fontweight='bold', color='#566573', ha='left', va='center')
    ax.text(0.5, 1.5, 'DATABASE', fontsize=12, fontweight='bold', color='#566573', ha='left', va='center')

    # Horizontal separator lines
    for y in [11.8, 8.8, 5.8, 2.8]:
        ax.axhline(y=y, xmin=0.08, xmax=0.92, color='#D5D8DC', linewidth=1.5, linestyle='--', alpha=0.6)

    # ========== LAYER 1: USERS (y=12.5 to 14.5) ==========
    draw_box(2.5, 12.5, 3.8, 1.5, colors['user'], 'Fleet Manager', 'Web Browser')
    draw_box(7, 12.5, 3.8, 1.5, colors['user'], 'Driver', 'Mobile/Web')
    draw_box(11.5, 12.5, 3.8, 1.5, colors['user'], 'Admin', 'Web Portal')
    draw_box(16, 12.5, 3.8, 1.5, colors['external'], 'IoT Devices', 'GPS/ELD/OBD')

    # ========== LAYER 2: FRONTEND (y=9.5 to 11.2) ==========
    draw_box(5, 9.5, 12, 1.7, colors['frontend'], 'Next.js Frontend', 'React 19  |  Tailwind CSS  |  Leaflet Maps  |  Recharts')

    # ========== LAYER 3: API LAYER (y=6.3 to 8.3) ==========
    draw_box(2.5, 6.5, 4.5, 1.7, colors['auth'], 'NextAuth', 'JWT Sessions')
    draw_box(8, 6.5, 6, 1.7, colors['api'], 'REST API Layer', 'Rate Limiting + Zod Validation')
    draw_box(15, 6.5, 4.5, 1.7, colors['api'], 'API Routes', '30+ Endpoints')

    # ========== LAYER 4: SERVICES (y=3.3 to 5.3) ==========
    draw_box(1.5, 3.5, 3.5, 1.7, colors['auth'], 'Auth Service', 'RBAC + Audit')
    draw_box(5.5, 3.5, 3.5, 1.7, colors['api'], 'Fleet Service', 'Vehicles/Drivers')
    draw_box(9.5, 3.5, 3.5, 1.7, colors['api'], 'Tracking', 'Real-time GPS')
    draw_box(13.5, 3.5, 3.5, 1.7, colors['api'], 'Analytics', 'Metrics/Reports')
    draw_box(17.5, 3.5, 3.5, 1.7, colors['api'], 'Compliance', 'ELD/DOT Logs')

    # ========== LAYER 5: DATABASE (y=0.5 to 2.3) ==========
    draw_box(5.5, 0.6, 11, 1.8, colors['database'], 'PostgreSQL Database', 'Prisma ORM  |  24 Tables  |  Indexed for Performance')

    # ========== ARROWS ==========

    # Users to Frontend
    draw_arrow((4.4, 12.5), (8, 11.2), 'HTTPS')
    draw_arrow((8.9, 12.5), (11, 11.2), 'HTTPS')
    draw_arrow((13.4, 12.5), (14, 11.2), 'HTTPS')

    # IoT to API Routes
    draw_arrow((17.9, 12.5), (17.25, 8.2), 'Telemetry', curve=-0.1)

    # Frontend to Auth
    draw_arrow((7, 9.5), (4.75, 8.2), 'Auth')

    # Frontend to API
    draw_arrow((11, 9.5), (11, 8.2), 'API Calls')

    # Auth to Auth Service
    draw_arrow((4.75, 6.5), (3.25, 5.2), 'Validate')

    # API Layer to Services
    draw_arrow((9, 6.5), (7.25, 5.2), 'CRUD')
    draw_arrow((11, 6.5), (11.25, 5.2), 'Query')
    draw_arrow((14, 6.8), (15.25, 5.2), 'Aggregate')
    draw_arrow((17.25, 6.5), (19.25, 5.2), 'Logs')

    # Services to Database
    draw_arrow((3.25, 3.5), (7.5, 2.4), 'R/W', curve=0.1)
    draw_arrow((7.25, 3.5), (9, 2.4), 'CRUD')
    draw_arrow((11.25, 3.5), (11, 2.4), 'Query')
    draw_arrow((15.25, 3.5), (13, 2.4), 'Agg', curve=-0.08)
    draw_arrow((19.25, 3.5), (14.5, 2.4), 'Logs', curve=-0.12)

    # ========== LEGEND (Top Left) ==========
    legend_x = 17
    legend_y = 11.5
    ax.add_patch(Rectangle((legend_x - 0.3, legend_y - 2.8), 4.8, 3.3,
                           facecolor='white', edgecolor='#BDC3C7', linewidth=1.5, alpha=0.95))
    ax.text(legend_x + 2.1, legend_y + 0.2, 'Legend', fontsize=12, fontweight='bold',
            ha='center', color='#2C3E50')

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
        x = legend_x + col * 2.2
        y = legend_y - 0.6 - row * 0.7
        ax.add_patch(Rectangle((x, y), 0.45, 0.45, facecolor=color, edgecolor='#2C3E50', linewidth=1))
        ax.text(x + 0.6, y + 0.22, label, fontsize=9, va='center', color='#2C3E50')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'data_flow_diagram.png'), dpi=150, bbox_inches='tight',
                facecolor='#FAFAFA', edgecolor='none', pad_inches=0.5)
    plt.close()
    print("Created: data_flow_diagram.png")

if __name__ == "__main__":
    create_data_flow_diagram()
    print("Done!")
