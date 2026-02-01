import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";
import { createLogger } from "./logger";

const log = createLogger("rate-limiter");

// Default rate limiter configuration
const DEFAULT_POINTS = 100;

// Rate limiter types
export type RateLimitType = "api" | "auth" | "sensitive";

// Configuration for each rate limit type
const rateLimitConfig: Record<RateLimitType, { points: number; duration: number }> = {
  api: {
    points: parseInt(process.env.RATE_LIMIT_MAX || String(DEFAULT_POINTS)),
    duration: Math.floor(parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000") / 1000),
  },
  auth: {
    points: 10,
    duration: 60, // 10 requests per minute
  },
  sensitive: {
    points: 5,
    duration: 60, // 5 requests per minute
  },
};

// In-memory rate limiters (fallback for development or when Redis is not configured)
const memoryLimiters: Record<RateLimitType, RateLimiterMemory> = {
  api: new RateLimiterMemory(rateLimitConfig.api),
  auth: new RateLimiterMemory(rateLimitConfig.auth),
  sensitive: new RateLimiterMemory(rateLimitConfig.sensitive),
};

// Upstash Rate limiter instance cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let upstashRatelimitInstance: any = null;

async function getUpstashRatelimit(type: RateLimitType) {
  // Only use Upstash if UPSTASH_REDIS_REST_URL is configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!upstashRatelimitInstance) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      // Create rate limiter with sliding window algorithm
      upstashRatelimitInstance = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(
          rateLimitConfig[type].points,
          `${rateLimitConfig[type].duration}s`
        ),
        analytics: true,
        prefix: `fleettrack:ratelimit:${type}`,
      });
    } catch (error) {
      log.warn({ error }, "Failed to initialize Upstash Redis, falling back to memory");
      return null;
    }
  }

  return upstashRatelimitInstance;
}

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
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `ip:${ip}`;
}

// Rate limit check result
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Check rate limit using Upstash (production) or memory (development)
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "api"
): Promise<RateLimitResult> {
  // Try Upstash first (production)
  const upstash = await getUpstashRatelimit(type);

  if (upstash) {
    try {
      const result = await upstash.limit(identifier);

      if (!result.success) {
        log.warn(
          { identifier, type, remaining: result.remaining },
          "Rate limit exceeded (Upstash)"
        );
      }

      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      log.error({ error }, "Upstash rate limit check failed, falling back to memory");
      // Fall through to memory limiter
    }
  }

  // Fallback to memory limiter (development or Redis failure)
  const limiter = memoryLimiters[type];

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
        "Rate limit exceeded (memory)"
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
export function withRateLimit(type: RateLimitType = "api") {
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

export default memoryLimiters;
