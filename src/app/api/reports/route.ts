import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/services/financials/financials.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;

    const reports = await getReportData(session, businessId);
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Reports API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
