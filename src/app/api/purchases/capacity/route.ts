import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBusinessPurchaseCapacity } from "@/services/purchase/purchase.service";
import { requireActiveSession, requireBusinessAccess, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");
    const excludePurchaseId = searchParams.get("excludePurchaseId") || undefined;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "BAD_REQUEST", message: "businessId query parameter is required" },
        { status: 400 }
      );
    }

    await requireBusinessAccess(businessId, session, "READ");
    const capacity = await getBusinessPurchaseCapacity(prisma, businessId, excludePurchaseId);

    return NextResponse.json({
      success: true,
      capacity: {
        totalInvestment: Number(capacity.totalInvestment.toFixed(2)),
        existingPurchaseCost: Number(capacity.existingPurchaseCost.toFixed(2)),
        remainingPurchaseCapacity: Number(capacity.remainingPurchaseCapacity.toFixed(2)),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 400) {
        return NextResponse.json({ success: false, error: "BAD_REQUEST", message: error.message }, { status: 400 });
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Get Purchase Capacity API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
