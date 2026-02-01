import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeAllUserTokens } from "@/lib/tokenRevocation";
import { createLogger } from "@/lib/logger";
import { cookies } from "next/headers";

const log = createLogger("logout");

export async function POST() {
  try {
    const session = await auth();

    if (session?.user?.id) {
      // Revoke all tokens for this user
      await revokeAllUserTokens(session.user.id, "password_change");

      log.info({ userId: session.user.id }, "User logged out");
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("authjs.session-token");
    cookieStore.delete("__Secure-authjs.session-token");

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    log.error({ error }, "Error during logout");
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
