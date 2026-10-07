import { NextRequest, NextResponse } from "next/server";
import { getAvailableProductsForBusiness } from "@/services/sale/sale.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "BAD_REQUEST", message: "businessId query parameter is required" },
        { status: 400 }
      );
    }

    const products = await getAvailableProductsForBusiness(session, businessId);
    return NextResponse.json({ success: true, products });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 400) {
        return NextResponse.json(
          { success: false, error: "BAD_REQUEST", message: error.message },
          { status: 400 }
        );
      }
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Get Available Products API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
