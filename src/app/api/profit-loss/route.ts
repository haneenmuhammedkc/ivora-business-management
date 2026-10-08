import { NextRequest, NextResponse } from "next/server";
import { getFullProfitLossData } from "@/services/financials/financials.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { profitLossQuerySchema } from "@/validators/profit-loss.validator";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;

    const rawQuery = {
      businessId: searchParams.get("businessId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      period: searchParams.get("period") || undefined,
      status: searchParams.get("status") || undefined,
      productType: searchParams.get("productType") || undefined,
    };

    const parsedQuery = profitLossQuerySchema.parse(rawQuery);
    const data = await getFullProfitLossData(session, parsedQuery);

    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Profit Loss API Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
