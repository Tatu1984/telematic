import { prisma } from "./db";
import { createLogger } from "./logger";
import { createHash } from "crypto";

const log = createLogger("token-revocation");

// Hash a token to store in the blacklist (don't store raw tokens)
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Check if a token is revoked
export async function isTokenRevoked(tokenOrJti: string): Promise<boolean> {
  try {
    const jti = hashToken(tokenOrJti);
    const revoked = await prisma.revokedToken.findUnique({
      where: { jti },
    });
    return !!revoked;
  } catch (error) {
    log.error({ error }, "Error checking token revocation");
    // Fail open for availability, but log the error
    return false;
  }
}

// Revoke a token
export async function revokeToken(
  token: string,
  userId: string,
  reason: "logout" | "password_change" | "admin_revoke" | "security",
  expiresAt: Date
): Promise<void> {
  try {
    const jti = hashToken(token);

    await prisma.revokedToken.upsert({
      where: { jti },
      update: { reason, revokedAt: new Date() },
      create: {
        jti,
        userId,
        reason,
        expiresAt,
      },
    });

    log.info({ userId, reason }, "Token revoked");
  } catch (error) {
    log.error({ error, userId }, "Error revoking token");
    throw error;
  }
}

// Revoke all tokens for a user (e.g., on password change)
export async function revokeAllUserTokens(
  userId: string,
  reason: "password_change" | "admin_revoke" | "security"
): Promise<void> {
  try {
    // Get all active sessions for the user
    const sessions = await prisma.session.findMany({
      where: { userId },
    });

    // Revoke each session token
    for (const session of sessions) {
      await revokeToken(session.sessionToken, userId, reason, session.expires);
    }

    // Also delete the sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    log.info({ userId, reason, sessionCount: sessions.length }, "All user tokens revoked");
  } catch (error) {
    log.error({ error, userId }, "Error revoking all user tokens");
    throw error;
  }
}

// Clean up expired revoked tokens (run periodically)
export async function cleanupExpiredRevokedTokens(): Promise<number> {
  try {
    const result = await prisma.revokedToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      log.info({ count: result.count }, "Cleaned up expired revoked tokens");
    }

    return result.count;
  } catch (error) {
    log.error({ error }, "Error cleaning up expired revoked tokens");
    return 0;
  }
}
