import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withRateLimit } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";

const log = createLogger("admin-users");

// Define valid roles for validation
const SAAS_ROLES = ["saas_admin", "saas_subscriber_manager", "saas_support", "saas_developer"];
const COMPANY_ROLES = ["company_admin", "fleet_manager", "driver", "company_support"];

const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum([...SAAS_ROLES, ...COMPANY_ROLES] as [string, ...string[]]),
  organizationId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["saas_admin", "company_admin"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit("sensitive")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validatedData = userSchema.parse(body);

    // Prevent privilege escalation: company_admin cannot create SaaS-level users
    if (session.user.role === "company_admin") {
      if (SAAS_ROLES.includes(validatedData.role)) {
        return NextResponse.json(
          { error: "Cannot create SaaS-level users" },
          { status: 403 }
        );
      }
      // company_admin cannot create users for other organizations
      if (validatedData.organizationId && validatedData.organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: "Cannot create users for other organizations" },
          { status: 403 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash default password
    const { hash } = await import("bcryptjs");
    const defaultPassword = await hash("user123", 12);

    // Determine organization
    let organizationId = validatedData.organizationId;
    if (!organizationId && session.user.organizationId) {
      organizationId = session.user.organizationId;
    }

    // SaaS roles should not have an organization
    if (SAAS_ROLES.includes(validatedData.role)) {
      organizationId = undefined;
    }

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: defaultPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        role: validatedData.role,
        status: "active",
        organizationId: organizationId || null,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error creating user");
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// Add a log for successful user creation
// Already done above but let's add a proper log after user creation
