import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { withRateLimit } from "@/lib/rateLimit";
import { revokeAllUserTokens } from "@/lib/tokenRevocation";
import { createLogger } from "@/lib/logger";

const log = createLogger("password");

// Strong password policy: min 12 chars, uppercase, lowercase, number, special char
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply strict rate limiting for password changes
    const rateLimitResponse = await withRateLimit("sensitive")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validatedData = passwordSchema.parse(body);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await compare(validatedData.currentPassword, user.password);
    if (!isValid) {
      log.warn({ userId: session.user.id }, "Invalid current password attempt");
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(validatedData.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    // Revoke all existing sessions for security
    try {
      await revokeAllUserTokens(session.user.id, "password_change");
    } catch (revokeError) {
      // Log but don't fail - password was changed successfully
      log.error({ error: revokeError, userId: session.user.id }, "Failed to revoke tokens after password change");
    }

    log.info({ userId: session.user.id }, "Password changed successfully");

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please log in again.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error updating password");
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
