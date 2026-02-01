import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import { withRateLimit, getClientIdentifier, checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";
import { randomBytes } from "crypto";
import { revokeAllUserTokens } from "@/lib/tokenRevocation";

const log = createLogger("password-reset");

// Schema for requesting a password reset
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Schema for completing password reset
const completeResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

// Generate a secure random token
function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

// Request password reset (POST with email)
export async function POST(request: Request) {
  try {
    // Apply strict rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, "auth");
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body = await request.json();

    // Check if this is a reset request or a complete reset
    if (body.token) {
      // Complete password reset
      const validatedData = completeResetSchema.parse(body);
      return await completePasswordReset(validatedData.token, validatedData.newPassword);
    } else {
      // Request password reset
      const validatedData = requestResetSchema.parse(body);
      return await requestPasswordReset(validatedData.email);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    log.error({ error }, "Error in password reset");
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500 }
    );
  }
}

async function requestPasswordReset(email: string) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, firstName: true },
  });

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    success: true,
    message: "If an account exists with that email, a password reset link has been sent.",
  });

  if (!user) {
    log.info({ email }, "Password reset requested for non-existent email");
    return successResponse;
  }

  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Generate new token
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

  // Store token
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // In production, send email here
  // For now, log the token (in development only)
  if (process.env.NODE_ENV === "development") {
    log.info(
      { email, token, resetUrl: `${process.env.AUTH_URL}/reset-password?token=${token}` },
      "Password reset token generated (dev only)"
    );
  } else {
    log.info({ userId: user.id }, "Password reset token generated");
  }

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // await sendPasswordResetEmail(user.email, user.firstName, token);

  return successResponse;
}

async function completePasswordReset(token: string, newPassword: string) {
  // Find the token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    log.warn({ tokenProvided: !!token }, "Invalid password reset token");
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    log.warn({ userId: resetToken.userId }, "Expired password reset token used");
    // Clean up expired token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return NextResponse.json(
      { error: "Reset token has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Check if token was already used
  if (resetToken.usedAt) {
    log.warn({ userId: resetToken.userId }, "Already used password reset token");
    return NextResponse.json(
      { error: "This reset token has already been used." },
      { status: 400 }
    );
  }

  // Hash the new password
  const hashedPassword = await hash(newPassword, 12);

  // Update password and mark token as used in a transaction
  await prisma.$transaction(async (tx) => {
    // Update password
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
  });

  // Revoke all existing sessions for security
  try {
    await revokeAllUserTokens(resetToken.userId, "password_change");
  } catch (revokeError) {
    log.error({ error: revokeError, userId: resetToken.userId }, "Failed to revoke tokens after password reset");
  }

  log.info({ userId: resetToken.userId }, "Password reset completed successfully");

  return NextResponse.json({
    success: true,
    message: "Password has been reset successfully. Please log in with your new password.",
  });
}

// GET endpoint to validate a reset token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { expiresAt: true, usedAt: true },
    });

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        message: "Invalid reset token",
      });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({
        valid: false,
        message: "This reset token has already been used",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        message: "Reset token has expired",
      });
    }

    return NextResponse.json({
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    log.error({ error }, "Error validating reset token");
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
