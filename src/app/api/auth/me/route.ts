import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { unauthorizedResponse } from "@/lib/auth/guards";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse("User is not authenticated or account is inactive");
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("[Me API Error]", error);
    return unauthorizedResponse("Invalid authentication session");
  }
}
