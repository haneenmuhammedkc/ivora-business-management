import { NextRequest, NextResponse } from "next/server";
import { getBusinessById, updateBusiness } from "@/services/business/business.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    const business = await getBusinessById(session, id);
    return NextResponse.json({ success: true, business });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[Get Business API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveSession();
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const updated = await updateBusiness(session, id, body);
    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 404) {
        return NextResponse.json({ success: false, error: "NOT_FOUND", message: error.message }, { status: 404 });
      }
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      return NextResponse.json({ success: false, error: "VALIDATION_ERROR", message: error.message }, { status: error.statusCode });
    }
    console.error("[Update Business API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
