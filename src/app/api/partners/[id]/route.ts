import { NextRequest, NextResponse } from "next/server";
import {
  getPartnerById,
  updatePartnerProfile,
  updatePartnerStatus,
} from "@/services/partner/partner.service";
import {
  requireAdmin,
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/auth/guards";
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

    if (!body) {
      return errorResponse("Request payload is required", 400);
    }

    // 1. Profile Update (Name + Phone)
    if (body.name !== undefined || body.phone !== undefined) {
      if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
        return errorResponse("Partner name is required", 400);
      }

      const phone =
        typeof body.phone === "string" && body.phone.trim().length > 0
          ? body.phone.trim()
          : null;

      const result = await updatePartnerProfile({
        adminUserId: adminSession.userId,
        partnerId: id,
        name: body.name.trim(),
        phone,
        ipAddress: ip,
      });

      if (!result.success) {
        return errorResponse(result.error || "Failed to update partner profile", 400);
      }

      return NextResponse.json({
        success: true,
        message: "Partner profile updated successfully",
        partner: result.partner,
      });
    }

    // 2. Status Update
    if (body.status !== undefined) {
      const rawStatus =
        typeof body.status === "string" ? body.status.trim().toUpperCase() : body.status;
      const normalizedStatus = rawStatus === "DEACTIVE" ? UserStatus.INACTIVE : rawStatus;

      const validStatuses = Object.values(UserStatus);
      if (!validStatuses.includes(normalizedStatus)) {
        return errorResponse(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}, DEACTIVE`,
          400
        );
      }

      const result = await updatePartnerStatus({
        adminUserId: adminSession.userId,
        partnerId: id,
        status: normalizedStatus as UserStatus,
        ipAddress: ip,
      });

      if (!result.success) {
        return errorResponse(result.error || "Failed to update partner status", 400);
      }

      return NextResponse.json({
        success: true,
        message: "Partner status updated successfully",
      });
    }

    return errorResponse(
      "Valid update fields ('name' and 'phone', or 'status') are required",
      400
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return unauthorizedResponse("Authentication required");
      }
      if (error.message === "FORBIDDEN") {
        return forbiddenResponse("Admin role required to update partner");
      }
    }
    console.error("[Update Partner API Error]", error);
    return errorResponse("An unexpected error occurred while updating partner", 500);
  }
}
