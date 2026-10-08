import { NextRequest, NextResponse } from "next/server";
import { listExpenses, createExpense } from "@/services/expense/expense.service";
import { requireActiveSession, forbiddenErrorResponse } from "@/lib/auth/authorization";
import { AuthError, unauthorizedResponse } from "@/lib/auth/guards";
import { ZodError } from "zod";
import { ExpenseCategory, ExpensePaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveSession();
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get("businessId") || undefined;
    const category = (searchParams.get("category") as ExpenseCategory) || undefined;
    const status = (searchParams.get("status") as ExpensePaymentStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const expenses = await listExpenses(session, businessId, {
      category,
      status,
      search,
    });
    return NextResponse.json({ success: true, expenses, data: expenses });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[List Expenses API Error]", error);
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

    const expense = await createExpense(session, body);
    return NextResponse.json({ success: true, expense, data: expense }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    if (error instanceof AuthError) {
      return error.statusCode === 401
        ? unauthorizedResponse(error.message)
        : forbiddenErrorResponse(error.message);
    }
    console.error("[Create Expense API Error]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
