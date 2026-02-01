import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLogger, logError } from "@/lib/logger";
import { withRateLimit, RateLimitType } from "@/lib/rateLimit";
import { v4 as uuidv4 } from "uuid";
import type { SessionUser } from "@/types";

interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: RateLimitType;
  logContext?: string;
}

interface ApiContext {
  session: { user: SessionUser } | null;
  log: ReturnType<typeof createLogger>;
  requestId: string;
}

type ApiHandler = (
  request: Request,
  context: ApiContext
) => Promise<NextResponse>;

export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  const {
    requireAuth = true,
    allowedRoles,
    rateLimit = "api",
    logContext = "api",
  } = options;

  return async function wrappedHandler(request: Request): Promise<NextResponse> {
    const requestId = uuidv4();
    const log = createLogger(logContext, { requestId });
    const startTime = Date.now();

    try {
      // Rate limiting
      const rateLimitResponse = await withRateLimit(rateLimit)(request);
      if (rateLimitResponse) {
        log.warn("Rate limit exceeded");
        return rateLimitResponse;
      }

      // Authentication
      const session = await auth();

      if (requireAuth && !session?.user) {
        log.warn("Unauthorized access attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Role checking
      if (allowedRoles && session?.user) {
        if (!allowedRoles.includes(session.user.role)) {
          log.warn({ role: session.user.role }, "Forbidden - insufficient permissions");
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      // Execute handler
      const response = await handler(request, {
        session: session as { user: SessionUser } | null,
        log,
        requestId,
      });

      // Log completion
      const duration = Date.now() - startTime;
      log.info({ durationMs: duration, status: response.status }, "Request completed");

      return response;
    } catch (error) {
      logError(log, error, { operation: logContext });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(
  json: string,
  fallback: T,
  log?: ReturnType<typeof createLogger>
): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    if (log) {
      log.warn({ json: json.substring(0, 100) }, "Failed to parse JSON");
    }
    return fallback;
  }
}

// Paginate results helper
export function paginate<T>(
  items: T[],
  page: number = 1,
  limit: number = 20,
  maxLimit: number = 100
): { data: T[]; total: number; page: number; limit: number; totalPages: number } {
  const safeLimit = Math.min(Math.max(limit, 1), maxLimit);
  const safePage = Math.max(page, 1);
  const total = items.length;
  const totalPages = Math.ceil(total / safeLimit);
  const start = (safePage - 1) * safeLimit;
  const data = items.slice(start, start + safeLimit);

  return {
    data,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };
}
