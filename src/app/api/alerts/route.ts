import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    if (unreadOnly) {
      where.read = false;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        geofence: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertIds, action } = body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json({ error: "No alert IDs provided" }, { status: 400 });
    }

    const updateData: Record<string, boolean> = {};
    if (action === "read") {
      updateData.read = true;
    } else if (action === "acknowledge") {
      updateData.acknowledged = true;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
        ...(session.user.organizationId
          ? { organizationId: session.user.organizationId }
          : {}),
      },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alerts:", error);
    return NextResponse.json(
      { error: "Failed to update alerts" },
      { status: 500 }
    );
  }
}
