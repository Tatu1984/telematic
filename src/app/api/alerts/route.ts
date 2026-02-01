import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";

const log = createLogger("alerts");

// Query parameter validation schema
const querySchema = z.object({
  unread: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  severity: z.enum(["info", "warning", "critical", "all"]).optional(),
  type: z.enum(["geofence", "speeding", "maintenance", "eld_violation", "safety", "system", "all"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("api")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const queryResult = querySchema.safeParse({
      unread: searchParams.get("unread") || undefined,
      limit: searchParams.get("limit") || 50,
      offset: searchParams.get("offset") || 0,
      severity: searchParams.get("severity") || undefined,
      type: searchParams.get("type") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.issues },
        { status: 400 }
      );
    }

    const { unread, limit, offset, severity, type } = queryResult.data;

    const where: Record<string, unknown> = session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : {};

    if (unread === "true") {
      where.read = false;
    }

    if (severity && severity !== "all") {
      where.severity = severity;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    // Get total count for pagination
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
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
        skip: offset,
      }),
      prisma.alert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + alerts.length < total,
      },
    });
  } catch (error) {
    log.error({ error }, "Error fetching alerts");
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// Schema for validating alert update requests
const alertUpdateSchema = z.object({
  alertIds: z.array(z.string().cuid()).min(1, "At least one alert ID is required").max(100, "Cannot update more than 100 alerts at once"),
  action: z.enum(["read", "acknowledge"]),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("api")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    // Validate input with proper schema
    const validationResult = alertUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { alertIds, action } = validationResult.data;

    const updateData: Record<string, boolean> = {};
    if (action === "read") {
      updateData.read = true;
    } else if (action === "acknowledge") {
      updateData.acknowledged = true;
    }

    // First verify all alerts belong to the user's organization
    if (session.user.organizationId) {
      const alertCount = await prisma.alert.count({
        where: {
          id: { in: alertIds },
          organizationId: session.user.organizationId,
        },
      });

      if (alertCount !== alertIds.length) {
        return NextResponse.json(
          { error: "One or more alerts not found or access denied" },
          { status: 403 }
        );
      }
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
        ...(session.user.organizationId
          ? { organizationId: session.user.organizationId }
          : {}),
      },
      data: updateData,
    });

    log.info(
      { userId: session.user.id, action, alertCount: result.count },
      "Alerts updated"
    );

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error updating alerts");
    return NextResponse.json(
      { error: "Failed to update alerts" },
      { status: 500 }
    );
  }
}
