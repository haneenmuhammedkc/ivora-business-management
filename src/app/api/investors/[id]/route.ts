import { NextRequest, NextResponse } from "next/server";
import { getInvestorById, updateInvestor, deleteInvestor } from "@/services/investor/investor.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse, requireAdmin } from "@/lib/auth/guards";
import { validateUpdateInvestor } from "@/validators/investor.validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    const investor = await getInvestorById(session, id);
    return NextResponse.json({ success: true, investor });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Get Investor API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const validationResult = validateUpdateInvestor(body);
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

    const updated = await updateInvestor(session, id, validationResult.data);
    return NextResponse.json({ success: true, investor: updated });
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
    console.error("[Update Investor API Error]", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const forceDeactivate = body?.forceDeactivate === true;

    const result = await deleteInvestor(session, id, { forceDeactivate });
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
    console.error("[Delete Investor API Error]", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

