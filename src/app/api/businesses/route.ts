import { NextRequest, NextResponse } from "next/server";
import { listBusinesses, createBusiness } from "@/services/business/business.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";

export async function GET() {
  try {
    const session = await requireActiveSession();
    const businesses = await listBusinesses(session);
    return NextResponse.json({ success: true, businesses });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[List Businesses API Error]", error);
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

    const business = await createBusiness(session, body);
    return NextResponse.json({ success: true, business }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Create Business API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
