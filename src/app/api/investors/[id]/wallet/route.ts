import { NextRequest, NextResponse } from "next/server";
import { getInvestorWalletSummary } from "@/services/investor/wallet.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    if (session.role !== "ADMIN" && session.role !== "PARTNER") {
      return forbiddenErrorResponse("Forbidden: Only Admins and assigned Partners can view investor wallets.");
    }
    const { id: investorId } = await params;

    const summary = await getInvestorWalletSummary(session, investorId);
    return NextResponse.json({ success: true, ...summary });
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
    console.error("[Get Investor Wallet API Error]", error);
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message: errorMsg }, { status: 500 });
  }
}
