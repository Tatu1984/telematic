import { NextResponse } from "next/server";
import { setCsrfToken } from "@/lib/csrf";

/**
 * GET /api/csrf
 * Get a new CSRF token for client-side usage
 */
export async function GET() {
  try {
    const token = await setCsrfToken();

    return NextResponse.json({
      csrfToken: token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}
