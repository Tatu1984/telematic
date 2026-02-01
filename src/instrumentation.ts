import { createLogger } from "./lib/logger";

const log = createLogger("instrumentation");

export async function register() {
  // Only register instrumentation in Node.js runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Global unhandled rejection handler
    process.on("unhandledRejection", (reason, promise) => {
      log.error(
        {
          reason: reason instanceof Error ? reason.message : String(reason),
          stack: reason instanceof Error ? reason.stack : undefined,
        },
        "Unhandled Promise Rejection"
      );
    });

    // Global uncaught exception handler
    process.on("uncaughtException", (error) => {
      log.fatal(
        {
          error: error.message,
          stack: error.stack,
        },
        "Uncaught Exception - Process may be unstable"
      );
      // In production, you might want to gracefully shutdown
      // process.exit(1);
    });

    // SIGTERM handler for graceful shutdown
    process.on("SIGTERM", () => {
      log.info({}, "SIGTERM received - Starting graceful shutdown");
      // Add cleanup logic here if needed
    });

    log.info({}, "Instrumentation registered successfully");
  }
}

// Optional: onRequestError for capturing API route errors
export function onRequestError(
  error: Error,
  request: { method: string; path: string },
  context: { routerKind: string; routePath: string; revalidateReason?: string }
) {
  log.error(
    {
      error: error.message,
      stack: error.stack,
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
      routePath: context.routePath,
      revalidateReason: context.revalidateReason,
    },
    "Request error in API route"
  );
}
