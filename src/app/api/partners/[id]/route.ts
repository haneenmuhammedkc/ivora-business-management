import { NextRequest, NextResponse } from "next/server";
import { getPartnerById, updatePartnerStatus } from "@/services/partner/partner.service";
import { requireAdmin, errorResponse, forbiddenResponse, unauthorizedResponse } from "@/lib/auth/guards";
import { getClientIp } from "@/lib/auth/rate-limiter";
import { UserStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const { id } = await params;
    const partner = await getPartnerById(id);

    if (!partner) {
      return errorResponse("Partner not found", 404);
    }

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to view partner details");
      }
    }
    console.error("[Get Partner by ID API Error]", error);
    return errorResponse("An unexpected error occurred while fetching partner", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await requireAdmin().catch((err) => {
      if (err.statusCode === 401) throw new Error("UNAUTHORIZED");
      throw new Error("FORBIDDEN");
    });

    const { id } = await params;
    const ip = getClientIp(req.headers);
    const body = await req.json().catch(() => null);

    if (!body || !body.status) {
      return errorResponse("Status field is required", 400);
    }

    const validStatuses = Object.values(UserStatus);
    if (!validStatuses.includes(body.status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const result = await updatePartnerStatus({
      adminUserId: adminSession.userId,
      partnerId: id,
      status: body.status,
      ipAddress: ip,
    });

    if (!result.success) {
      return errorResponse(result.error || "Failed to update partner status", 400);
    }

    return NextResponse.json({
      success: true,
      message: "Partner status updated successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to update partner status");
      }
    }
    console.error("[Update Partner Status API Error]", error);
    return errorResponse("An unexpected error occurred while updating partner status", 500);
  }
}
