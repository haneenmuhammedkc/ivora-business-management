import { NextRequest, NextResponse } from "next/server";
import { completeWithdrawal } from "@/services/investor/wallet.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse, requireAdmin } from "@/lib/auth/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; withdrawalId: string }> }
) {
  try {
    const session = await requireActiveSession();
    await requireAdmin();
    const { withdrawalId } = await params;

    const body = await req.json().catch(() => ({}));
    const result = await completeWithdrawal(session, withdrawalId, body);
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
    console.error("[Complete Withdrawal API Error]", error);
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message: errorMsg }, { status: 500 });
  }
}
