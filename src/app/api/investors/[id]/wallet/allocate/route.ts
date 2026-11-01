import { NextRequest, NextResponse } from "next/server";
import { allocateWalletFundsToBusiness } from "@/services/investor/wallet.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    if (session.role !== "ADMIN" && session.role !== "PARTNER") {
      return forbiddenErrorResponse("Forbidden: Only Admins and assigned Partners can allocate wallet funds.");
    }
    const { id: investorId } = await params;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await allocateWalletFundsToBusiness(session, investorId, body);
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
    console.error("[Wallet Allocate API Error]", error);
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message: errorMsg }, { status: 500 });
  }
}
