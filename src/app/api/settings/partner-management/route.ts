import { NextResponse } from "next/server";
import { getPartnerManagementData } from "@/services/partner/partner.service";
import { requireAdmin, errorResponse, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const partners = await getPartnerManagementData();

    return NextResponse.json({
      success: true,
      partners,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to view partner management");
      }
    }
    console.error("[Get Partner Management API Error]", error);
    return errorResponse("An unexpected error occurred while fetching partner management data", 500);
  }
}
