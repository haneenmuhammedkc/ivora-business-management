import { NextRequest, NextResponse } from "next/server";
import {
  listBusinessInvestorRows,
  getBusinessInvestorDetails,
  createInvestor,
} from "@/services/investor/investor.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");

    if (businessId && businessId !== "all") {
      const details = await getBusinessInvestorDetails(session, businessId);
      return NextResponse.json({
        success: true,
        business: details.business,
        participants: details.business.participants,
        kpis: details.kpis,
      });
    }

    const result = await listBusinessInvestorRows(session);
    return NextResponse.json({
      success: true,
      businesses: result.businesses,
      kpis: result.kpis,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[List Investors API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await createInvestor(session, body);
    return NextResponse.json(
      {
        success: true,
        investor: result.investor,
        investment: result.investment,
        equityPct: result.equityPct,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[Create Investor API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
