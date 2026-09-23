import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/services/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { errorResponse, rateLimitResponse } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || !body.email) {
      return errorResponse("Email address is required", 400);
    }

    const rateLimit = checkRateLimit({
      key: `forgot-pwd:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000, // 5 requests per 15 min
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetInSeconds);
    }

    const result = await requestPasswordReset({
      email: body.email,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[Forgot Password API Error]", error);
    return errorResponse("An unexpected error occurred while processing password reset", 500);
  }
}
