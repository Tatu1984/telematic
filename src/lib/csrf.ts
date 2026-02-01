import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createLogger } from "./logger";

const log = createLogger("csrf");

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Hash a CSRF token for comparison
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Set CSRF token in cookie (call from server component or API route)
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: "/",
  });

  return token;
}

/**
 * Validate CSRF token from request
 * Returns true if valid, false if invalid
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const storedTokenHash = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!storedTokenHash) {
      log.warn({}, "CSRF token not found in cookies");
      return false;
    }

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) {
      log.warn({}, "CSRF token not found in request header");
      return false;
    }

    // Hash the header token and compare
    const headerTokenHash = hashToken(headerToken);
    const isValid = storedTokenHash === headerTokenHash;

    if (!isValid) {
      log.warn({}, "CSRF token mismatch");
    }

    return isValid;
  } catch (error) {
    log.error({ error }, "Error validating CSRF token");
    return false;
  }
}

/**
 * CSRF validation middleware for API routes
 * Use this for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export async function csrfProtection(request: Request): Promise<Response | null> {
  // Skip CSRF check for safe methods
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (safeMethod) {
    return null;
  }

  // Skip for API routes that handle their own authentication (like NextAuth)
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return null;
  }

  // Validate CSRF token
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid CSRF token" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null;
}

/**
 * Get CSRF token for client-side usage
 * This should be called from a server component and passed to client
 */
export async function getCsrfTokenForClient(): Promise<string> {
  return await setCsrfToken();
}
