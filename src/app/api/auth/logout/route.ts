import { NextRequest, NextResponse } from "next/server";
import { logoutUser } from "@/services/auth/auth.service";
import { getSession } from "@/lib/auth/session";
import { getClientIp } from "@/lib/auth/rate-limiter";
import { errorResponse } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const session = await getSession();

    await logoutUser(session?.userId, ip);

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("[Logout API Error]", error);
    return errorResponse("An unexpected error occurred during logout", 500);
  }
}
