import { NextRequest, NextResponse } from "next/server";
import { listBusinesses, createBusiness } from "@/services/business/business.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { validateCreateBusiness } from "@/validators";

export async function GET() {
  try {
    const session = await requireActiveSession();
    const businesses = await listBusinesses(session);
    return NextResponse.json({ success: true, businesses });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error("[List Businesses API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: { general: "Invalid JSON payload" },
        },
        { status: 400 }
      );
    }

    // 1. Centralized Business Input Validation
    const validationResult = validateCreateBusiness(body);
    if (!validationResult.isValid || !validationResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // 2. Delegate to Business Service with Validated & Sanitized Data
    const business = await createBusiness(session, validationResult.data);
    return NextResponse.json({ success: true, business }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 401) return unauthorizedResponse(error.message);
      if (error.statusCode === 403) return forbiddenErrorResponse(error.message);
      if (error.statusCode === 409) {
        return NextResponse.json({ success: false, error: "CONFLICT", message: error.message }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "VALIDATION_ERROR", message: error.message }, { status: error.statusCode });
    }
    console.error("[Create Business API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

