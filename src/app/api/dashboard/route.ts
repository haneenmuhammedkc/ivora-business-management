import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboard/dashboard.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { DashboardRange } from "@/types/dashboard";

const VALID_RANGES: readonly DashboardRange[] = ["7d", "30d", "3m", "1y"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;

    const businessId = searchParams.get("businessId") || undefined;
    const rawRange = searchParams.get("range");

    let range: DashboardRange = "30d";
    if (rawRange && VALID_RANGES.includes(rawRange as DashboardRange)) {
      range = rawRange as DashboardRange;
    }

    const data = await getDashboardData(session, {
      businessId,
      range,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Dashboard API Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
