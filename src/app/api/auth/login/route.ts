import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/services/auth/auth.service";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limiter";
import { errorResponse, rateLimitResponse } from "@/lib/auth/guards";
import { validateLoginInput } from "@/validators/auth.validator";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit({
      key: `login:${ip}`,
      limit: 10,
      windowMs: 60 * 1000, // 10 attempts per minute
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetInSeconds);
    }

    const body = await req.json().catch(() => null);
    const validation = validateLoginInput(body);

    if (!validation.isValid || !validation.data) {
      const errorMessage =
        validation.errors.email ||
        validation.errors.password ||
        "Please provide a valid email and password.";
      return errorResponse(errorMessage, 400);
    }

    const result = await authenticateUser({
      email: validation.data.email,
      password: validation.data.password,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Invalid email or password", 401);
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      requiresActivationOtp: result.requiresActivationOtp || false,
      requiresPasswordChange: result.requiresPasswordChange || false,
    });
  } catch (error) {
    console.error("[Login API Error]", error);
    return errorResponse("An unexpected error occurred during authentication", 500);
  }
}
