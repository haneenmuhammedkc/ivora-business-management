import { NextRequest, NextResponse } from "next/server";
import { listPurchases, createPurchase } from "@/services/purchase/purchase.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;

    const purchases = await listPurchases(session, businessId);
    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[List Purchases API Error]", error);
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

    const purchase = await createPurchase(session, body);
    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Create Purchase API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
