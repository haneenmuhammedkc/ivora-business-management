import { NextRequest, NextResponse } from "next/server";
import { recordDisbursalPayment } from "@/services/investor/settlement.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse, requireAdmin } from "@/lib/auth/guards";
import { validateDisbursalPaymentInput } from "@/validators/investor.validator";

export async function POST(
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

    const validationResult = validateDisbursalPaymentInput(body);
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

    const result = await recordDisbursalPayment(session, {
      businessId,
      investorId,
      capitalAmount: validationResult.data.capitalAmount,
      profitAmount: validationResult.data.profitAmount,
      paymentMethod: validationResult.data.paymentMethod,
      bankReference: validationResult.data.bankReference,
      escrowAccount: validationResult.data.escrowAccount,
      transactionDate: validationResult.data.transactionDate,
      notes: validationResult.data.notes,
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

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Record Disbursal Payment API Error]", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (errorMsg.includes("Transaction already closed") || errorMsg.includes("expired transaction") || errorMsg.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "TRANSACTION_TIMEOUT",
          message: "The database transaction timed out while processing disbursement. Please check the current balance and try again.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while recording the disbursal payment. Please try again.",
      },
      { status: 500 }
    );
  }
}
