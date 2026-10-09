import { NextRequest, NextResponse } from "next/server";
import { getReportsOverview, getDetailedReport, ReportFilterQuery } from "@/services/reports/report.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { DetailedReportType } from "@/types/reports";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;

    const filters: ReportFilterQuery = {
      businessId: searchParams.get("businessId") || undefined,
      period: searchParams.get("period") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      product: searchParams.get("product") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const reportType = searchParams.get("reportType") as DetailedReportType | null;

    if (reportType) {
      const detailedReport = await getDetailedReport(session, reportType, filters);
      return NextResponse.json({ success: true, report: detailedReport });
    }

    const overview = await getReportsOverview(session, filters);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Reports API Error]", error);
    return NextResponse.json({ success: false, error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}
