import { NextRequest, NextResponse } from "next/server";
import {
  getInvestorSettlementOverview,
  updateInvestorProfitAllocation,
} from "@/services/investor/settlement.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse, requireAdmin } from "@/lib/auth/guards";
import { validateProfitAllocationInput } from "@/validators/investor.validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; investorId: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id: businessId, investorId } = await params;

    const overview = await getInvestorSettlementOverview(session, businessId, investorId);
    return NextResponse.json({ success: true, settlement: overview });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Get Settlement Overview API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; investorId: string }> }
) {
  try {
    const session = await requireActiveSession();
    await requireAdmin();
    const { id: businessId, investorId } = await params;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const validationResult = validateProfitAllocationInput(body);
    if (!validationResult.isValid || !validationResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validationResult.errors,
          message: Object.values(validationResult.errors)[0] || "Validation failed",
        },
        { status: 400 }
      );
    }

    const result = await updateInvestorProfitAllocation(session, {
      businessId,
      investorId,
      allocatedProfitAmount: validationResult.data.allocatedProfitAmount,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      if (error.statusCode === 400) {
        return NextResponse.json({ success: false, error: "BAD_REQUEST", message: error.message }, { status: 400 });
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Update Profit Allocation API Error]", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; investorId: string }> }
) {
  return PATCH(req, context);
}
