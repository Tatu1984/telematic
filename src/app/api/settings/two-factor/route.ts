import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const twoFactorSchema = z.object({
  phone: z.string().optional(),
  enable: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = twoFactorSchema.parse(body);

    if (validatedData.enable) {
      // Enable 2FA
      if (!validatedData.phone) {
        return NextResponse.json(
          { error: "Phone number is required to enable 2FA" },
          { status: 400 }
        );
      }

      // In a real implementation, you would:
      // 1. Send an SMS verification code to the phone number
      // 2. Verify the code before enabling 2FA
      // For now, we'll just save the settings

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorPhone: validatedData.phone,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication enabled",
      });
    } else {
      // Disable 2FA
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorPhone: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Two-factor authentication disabled",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating 2FA settings:", error);
    return NextResponse.json(
      { error: "Failed to update 2FA settings" },
      { status: 500 }
    );
  }
}
