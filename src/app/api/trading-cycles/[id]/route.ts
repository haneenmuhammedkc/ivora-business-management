import { NextRequest, NextResponse } from "next/server";
import { getTradingCycleById, updateTradingCycle, completeTradingCycle, deleteTradingCycle } from "@/services/trading-cycle/trading-cycle.service";
import { requireActiveSession, forbiddenErrorResponse, lockedResourceResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    const tradingCycle = await getTradingCycleById(session, id);
    return NextResponse.json({ success: true, tradingCycle });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Get Trading Cycle API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    if (body.action === "COMPLETE") {
      const completed = await completeTradingCycle(session, id);
      return NextResponse.json({ success: true, tradingCycle: completed });
    }

    const updated = await updateTradingCycle(session, id, body);
    return NextResponse.json({ success: true, tradingCycle: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      if (error.message.includes("immutable") || error.message.includes("finalized") || error.message.includes("locked")) {
        return lockedResourceResponse(error.message);
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Update Trading Cycle API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    await deleteTradingCycle(session, id);
    return NextResponse.json({ success: true, message: "Trading cycle deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      if (error.message.includes("immutable") || error.message.includes("finalized") || error.message.includes("locked")) {
        return lockedResourceResponse(error.message);
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Delete Trading Cycle API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
