import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";
import { createLogger } from "./logger";

const log = createLogger("rate-limiter");

// Default rate limiter configuration
const DEFAULT_POINTS = 100; // Number of requests
const DEFAULT_DURATION = 60; // Per 60 seconds

// Create different rate limiters for different use cases
const rateLimiters = {
  // General API rate limiter
  api: new RateLimiterMemory({
    points: parseInt(process.env.RATE_LIMIT_MAX || String(DEFAULT_POINTS)),
    duration: Math.floor(
      parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000") / 1000
    ),
  }),

  // Stricter rate limiter for authentication endpoints
  auth: new RateLimiterMemory({
    points: 10,
    duration: 60, // 10 requests per minute
  }),

  // Very strict rate limiter for sensitive operations
  sensitive: new RateLimiterMemory({
    points: 5,
    duration: 60, // 5 requests per minute
  }),
};

export type RateLimitType = keyof typeof rateLimiters;

// Get client identifier (IP address or user ID)
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // If user is authenticated, use user ID for rate limiting
  if (userId) {
    return `user:${userId}`;
  }

  // Otherwise, use IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
  return `ip:${ip}`;
}

// Rate limit check result
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Check rate limit
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "api"
): Promise<RateLimitResult> {
  const limiter = rateLimiters[type];

  try {
    const result = await limiter.consume(identifier);
    return {
      success: true,
      remaining: result.remainingPoints,
      resetTime: Date.now() + result.msBeforeNext,
    };
  } catch (error) {
    if (error && typeof error === "object" && "msBeforeNext" in error) {
      const rateLimitError = error as { msBeforeNext: number };
      log.warn(
        { identifier, type, retryAfter: rateLimitError.msBeforeNext },
        "Rate limit exceeded"
      );
      return {
        success: false,
        remaining: 0,
        resetTime: Date.now() + rateLimitError.msBeforeNext,
        retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000),
      };
    }
    throw error;
  }
}

// Create rate-limited response headers
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString());
  if (result.retryAfter) {
    headers.set("Retry-After", String(result.retryAfter));
  }
  return headers;
}

// Rate limit response helper
export function rateLimitExceededResponse(
  result: RateLimitResult
): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter: result.retryAfter,
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
    },
    {
      status: 429,
      headers: createRateLimitHeaders(result),
    }
  );
}

// Higher-order function to wrap API handlers with rate limiting
export function withRateLimit(
  type: RateLimitType = "api"
) {
  return async function rateLimit(
    request: Request,
    userId?: string
  ): Promise<NextResponse | null> {
    const identifier = getClientIdentifier(request, userId);
    const result = await checkRateLimit(identifier, type);

    if (!result.success) {
      return rateLimitExceededResponse(result);
    }

    return null; // Continue processing
  };
}

export default rateLimiters;
