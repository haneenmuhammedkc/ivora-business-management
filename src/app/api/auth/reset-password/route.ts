import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithOtp } from "@/services/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { errorResponse, rateLimitResponse } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || !body.email || !body.otp || !body.newPassword) {
      return errorResponse("Email, verification code, and new password are required", 400);
    }

    const rateLimit = checkRateLimit({
      key: `reset-pwd:${ip}:${body.email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetInSeconds);
    }

    const result = await resetPasswordWithOtp({
      email: body.email,
      otp: body.otp,
      newPassword: body.newPassword,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Password reset failed", 400);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. Please log in with your new password.",
    });
  } catch (error) {
    console.error("[Reset Password API Error]", error);
    return errorResponse("An unexpected error occurred while resetting password", 500);
  }
}
