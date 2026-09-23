import { NextRequest, NextResponse } from "next/server";
import { verifyOtpToken } from "@/services/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { errorResponse, rateLimitResponse } from "@/lib/auth/guards";
import { AuthTokenType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || !body.email || !body.otp) {
      return errorResponse("Email and 6-digit verification code are required", 400);
    }

    const rateLimit = checkRateLimit({
      key: `verify-otp:${ip}:${body.email}`,
      limit: 10,
      windowMs: 10 * 60 * 1000, // 10 attempts per 10 minutes
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetInSeconds);
    }

    const type = body.type === "PASSWORD_RESET" ? AuthTokenType.PASSWORD_RESET : AuthTokenType.ACCOUNT_ACTIVATION;

    const result = await verifyOtpToken({
      email: body.email,
      otp: body.otp,
      type,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Verification failed", 400, {
        remainingAttempts: result.remainingAttempts,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Verification successful",
    });
  } catch (error) {
    console.error("[Verify OTP API Error]", error);
    return errorResponse("An unexpected error occurred during OTP verification", 500);
  }
}
