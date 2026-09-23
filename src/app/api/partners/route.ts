import { NextRequest, NextResponse } from "next/server";
import { createPartnerUser, listPartners } from "@/services/partner/partner.service";
import { requireAdmin, errorResponse, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/guards";
import { getClientIp } from "@/lib/auth/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || !body.name || !body.email) {
      return errorResponse("Partner name and email are required", 400);
    }

    const result = await createPartnerUser({
      adminUserId: adminSession.userId,
      name: body.name,
      email: body.email,
      temporaryPassword: body.temporaryPassword,
      businessId: body.businessId,
      partnerEquityPct: body.partnerEquityPct !== undefined ? Number(body.partnerEquityPct) : undefined,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to create partner account", 400);
    }

    return NextResponse.json(
      {
        success: true,
        partner: result.partner,
        temporaryPassword: result.temporaryPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to create partner accounts");
      }
    }
    console.error("[Create Partner API Error]", error);
    return errorResponse("An unexpected error occurred while creating partner", 500);
  }
}

export async function GET() {
  try {
    await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const partners = await listPartners();

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
        return forbiddenResponse("Admin role required to view partner directory");
      }
    }
    console.error("[List Partners API Error]", error);
    return errorResponse("An unexpected error occurred while fetching partners", 500);
  }
}
