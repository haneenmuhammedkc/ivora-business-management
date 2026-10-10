import { NextRequest, NextResponse } from "next/server";
import { updatePartnerProfitShareOverride } from "@/services/partner/partner.service";
import { requireAdmin, errorResponse, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/guards";
import { getClientIp } from "@/lib/auth/rate-limiter";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const adminSession = await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const { partnerId } = await params;
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || typeof body.overrideEnabled !== "boolean") {
      return errorResponse("Field 'overrideEnabled' (boolean) is required", 400);
    }

    const result = await updatePartnerProfitShareOverride({
      adminUserId: adminSession.userId,
      partnerId,
      overrideEnabled: body.overrideEnabled,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to update profit-share override", 400);
    }

    return NextResponse.json({
      success: true,
      message: `Manual profit-share override ${body.overrideEnabled ? "enabled" : "disabled"} successfully`,
      partner: result.partner,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to configure partner profit-share override");
      }
    }
    console.error("[Update Partner Override API Error]", error);
    return errorResponse("An unexpected error occurred while updating profit-share override", 500);
  }
}
