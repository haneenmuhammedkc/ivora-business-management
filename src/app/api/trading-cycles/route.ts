import { NextRequest, NextResponse } from "next/server";
import { listTradingCycles, createTradingCycle } from "@/services/trading-cycle/trading-cycle.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;

    const tradingCycles = await listTradingCycles(session, businessId);
    return NextResponse.json({ success: true, tradingCycles });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[List Trading Cycles API Error]", error);
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

    const tradingCycle = await createTradingCycle(session, body);
    return NextResponse.json({ success: true, tradingCycle }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Create Trading Cycle API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
