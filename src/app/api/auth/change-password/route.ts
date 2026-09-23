import { NextRequest, NextResponse } from "next/server";
import { changeUserPassword } from "@/services/auth/auth.service";
import { requireAuth, errorResponse, unauthorizedResponse } from "@/lib/auth/guards";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { rateLimitResponse } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth().catch(() => null);
    if (!session) {
      return unauthorizedResponse("Authentication required to change password");
    }

    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit({
      key: `change-pwd:${session.userId}`,
      limit: 5,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetInSeconds);
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.newPassword) {
      return errorResponse("New password is required", 400);
    }

    const result = await changeUserPassword({
      userId: session.userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Password change failed", 400);
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("[Change Password API Error]", error);
    return errorResponse("An unexpected error occurred while changing password", 500);
  }
}
