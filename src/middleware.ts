import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Paths that don't require rate limiting or additional processing
const EXCLUDED_PATHS = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Check if path should be excluded
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip processing for excluded paths
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // Generate request ID for correlation
  const requestId = request.headers.get("x-request-id") || uuidv4();

  // Clone response headers
  const response = NextResponse.next();

  // Add request ID to response for correlation
  response.headers.set("x-request-id", requestId);

  // Add security headers (some may be duplicated in next.config.ts for redundancy)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // For API routes, add additional headers
  if (pathname.startsWith("/api")) {
    // Prevent caching of API responses by default
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // CORS headers for API routes (adjust origins as needed)
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.AUTH_URL,
      process.env.NEXTAUTH_URL,
      "http://localhost:3000",
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Request-ID"
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
