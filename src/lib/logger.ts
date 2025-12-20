import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

// Create the base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: logLevel,
  // Add base fields to all log entries
  base: {
    env: process.env.NODE_ENV,
    service: "fleettrack-pro",
  },
  // Customize timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
};

// In development, use pino-pretty for readable logs
// In production, use JSON format for log aggregation
const transport = isDevelopment
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }
  : undefined;

export const logger = pino({
  ...loggerConfig,
  transport,
});

// Helper to create child loggers with context
export function createLogger(context: string, meta?: Record<string, unknown>) {
  return logger.child({ context, ...meta });
}

// API request logger helper
export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  userId?: string;
  organizationId?: string;
}

export function createRequestLogger(context: RequestLogContext) {
  return logger.child({
    context: "api",
    ...context,
  });
}

// Performance logging helper
export function logPerformance(
  log: pino.Logger,
  operation: string,
  startTime: number
) {
  const duration = Date.now() - startTime;
  log.info({ operation, durationMs: duration }, `${operation} completed`);
  return duration;
}

// Error logging helper with structured error information
export function logError(
  log: pino.Logger,
  error: unknown,
  context?: Record<string, unknown>
) {
  if (error instanceof Error) {
    log.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
      error.message
    );
  } else {
    log.error(
      {
        error: String(error),
        ...context,
      },
      "Unknown error occurred"
    );
  }
}

export default logger;
