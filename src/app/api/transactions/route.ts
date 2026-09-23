import { NextRequest, NextResponse } from "next/server";
import { listTransactions, createTransaction } from "@/services/transaction/transaction.service";
import { requireActiveSession, forbiddenErrorResponse, lockedResourceResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;

    const transactions = await listTransactions(session, businessId);
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[List Transactions API Error]", error);
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

    const transaction = await createTransaction(session, body);
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Create Transaction API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH() {
  return lockedResourceResponse("Transaction records are immutable ledger entries and cannot be modified.");
}

export async function DELETE() {
  return lockedResourceResponse("Transaction records are immutable ledger entries and cannot be deleted.");
}
