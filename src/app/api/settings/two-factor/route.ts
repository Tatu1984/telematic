import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rateLimit";

const log = createLogger("two-factor");

// Schema for enabling 2FA
const enable2FASchema = z.object({
  action: z.literal("enable"),
});

// Schema for verifying 2FA setup
const verify2FASchema = z.object({
  action: z.literal("verify"),
  token: z.string().length(6, "Token must be 6 digits"),
});

// Schema for disabling 2FA
const disable2FASchema = z.object({
  action: z.literal("disable"),
  token: z.string().length(6, "Token must be 6 digits"),
});

const requestSchema = z.discriminatedUnion("action", [
  enable2FASchema,
  verify2FASchema,
  disable2FASchema,
]);

// Generate QR code URL for authenticator apps
async function generateQRCodeDataURL(otpauth: string): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(otpauth);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting for sensitive operation
    const rateLimitResponse = await withRateLimit("sensitive")(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Dynamically import otplib to avoid bundling issues
    const { authenticator } = await import("otplib");

    if (data.action === "enable") {
      // Check if 2FA is already enabled
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorEnabled: true, twoFactorSecret: true, email: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.twoFactorEnabled) {
        return NextResponse.json(
          { error: "Two-factor authentication is already enabled" },
          { status: 400 }
        );
      }

      // Generate a new secret
      const secret = authenticator.generateSecret();

      // Store the secret temporarily (not enabled yet until verified)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret },
      });

      // Generate OTP auth URL for QR code
      const otpauth = authenticator.keyuri(
        user.email,
        "FleetTrack Pro",
        secret
      );

      // Generate QR code
      const qrCodeDataUrl = await generateQRCodeDataURL(otpauth);

      log.info({ userId: session.user.id }, "2FA setup initiated");

      return NextResponse.json({
        success: true,
        message: "Scan the QR code with your authenticator app, then verify with a token",
        qrCode: qrCodeDataUrl,
        secret: secret, // Also provide secret for manual entry
      });
    }

    if (data.action === "verify") {
      // Get user with secret
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorEnabled: true, twoFactorSecret: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: "Please initiate 2FA setup first" },
          { status: 400 }
        );
      }

      if (user.twoFactorEnabled) {
        return NextResponse.json(
          { error: "Two-factor authentication is already enabled" },
          { status: 400 }
        );
      }

      // Verify the token
      const isValid = authenticator.verify({
        token: data.token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        log.warn({ userId: session.user.id }, "Invalid 2FA token during setup");
        return NextResponse.json(
          { error: "Invalid verification token" },
          { status: 400 }
        );
      }

      // Enable 2FA
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      });

      log.info({ userId: session.user.id }, "2FA enabled successfully");

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication has been enabled",
      });
    }

    if (data.action === "disable") {
      // Get user with secret
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorEnabled: true, twoFactorSecret: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json(
          { error: "Two-factor authentication is not enabled" },
          { status: 400 }
        );
      }

      // Verify the token before disabling
      const isValid = authenticator.verify({
        token: data.token,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        log.warn({ userId: session.user.id }, "Invalid 2FA token during disable");
        return NextResponse.json(
          { error: "Invalid verification token" },
          { status: 400 }
        );
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      log.info({ userId: session.user.id }, "2FA disabled successfully");

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication has been disabled",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    log.error({ error }, "Error in 2FA endpoint");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      available: true,
      message: user.twoFactorEnabled
        ? "Two-factor authentication is enabled"
        : "Two-factor authentication is available but not enabled",
    });
  } catch (error) {
    log.error({ error }, "Error getting 2FA status");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
