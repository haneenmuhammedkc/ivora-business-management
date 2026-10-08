import { NextRequest, NextResponse } from "next/server";
import { getFullBalanceSheetData } from "@/services/financials/financials.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { balanceSheetQuerySchema } from "@/validators/balance-sheet.validator";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;

    const rawQuery = {
      businessId: searchParams.get("businessId") || undefined,
      asOfDate: searchParams.get("asOfDate") || undefined,
      status: searchParams.get("status") || undefined,
      productType: searchParams.get("productType") || undefined,
    };

    const parsedQuery = balanceSheetQuerySchema.parse(rawQuery);
    const data = await getFullBalanceSheetData(session, parsedQuery);

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Balance Sheet API Error]", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
