import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/services/financials/financials.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;
    const format = searchParams.get("format") || "json";

    const reportData = await getReportData(session, businessId);

    if (format === "csv") {
      let csvContent = "CycleCode,StartDate,Status\n";
      for (const cycle of reportData.tradingCycles) {
        csvContent += `"${cycle.cycleCode}","${cycle.startDate.toISOString()}","${cycle.status}"\n`;
      }
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ivora-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportData,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Download Report API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
