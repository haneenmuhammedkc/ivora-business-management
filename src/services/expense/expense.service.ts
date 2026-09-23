import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, ExpenseCategory, ExpensePaymentStatus, UserRole } from "@prisma/client";

export interface CreateExpenseInput {
  businessId: string;
  tradingCycleId?: string;
  expenseCode: string;
  category: ExpenseCategory;
  description: string;
  refNo?: string;
  amount: number;
  expenseDate: string | Date;
  status?: ExpensePaymentStatus;
  isPurchaseLandedCost?: boolean;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  description?: string;
  refNo?: string;
  amount?: number;
  expenseDate?: string | Date;
  status?: ExpensePaymentStatus;
  isPurchaseLandedCost?: boolean;
}

export async function listExpenses(session: SessionPayload, businessId?: string) {
  if (businessId) {
    await requireBusinessAccess(businessId);
    return prisma.expense.findMany({
      where: { businessId },
      include: { business: { select: { id: true, name: true, code: true } } },
      orderBy: { expenseDate: "desc" },
    });
  }

  const where: Prisma.ExpenseWhereInput =
    session.role === UserRole.ADMIN
      ? {}
      : { business: { partnerId: session.userId } };

  return prisma.expense.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true } } },
    orderBy: { expenseDate: "desc" },
  });
}

export async function getExpenseById(session: SessionPayload, expenseId: string) {
  const { resource } = await requireResourceAccess("Expense", expenseId, "READ");
  return resource;
}

export async function createExpense(session: SessionPayload, input: CreateExpenseInput) {
  await requireBusinessAccess(input.businessId);

  const expense = await prisma.expense.create({
    data: {
      businessId: input.businessId,
      tradingCycleId: input.tradingCycleId || null,
      expenseCode: input.expenseCode.trim(),
      category: input.category,
      description: input.description.trim(),
      refNo: input.refNo?.trim() || null,
      amount: new Prisma.Decimal(input.amount),
      expenseDate: new Date(input.expenseDate),
      status: input.status || ExpensePaymentStatus.CLEARED,
      isPurchaseLandedCost: input.isPurchaseLandedCost || false,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_CREATED",
    entity: "Expense",
    entityId: expense.id,
    newValues: { code: expense.expenseCode, amount: input.amount, category: input.category },
  });

  return expense;
}

export async function updateExpense(session: SessionPayload, expenseId: string, input: UpdateExpenseInput) {
  await requireResourceAccess("Expense", expenseId, "WRITE");

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      category: input.category,
      description: input.description?.trim(),
      refNo: input.refNo !== undefined ? input.refNo?.trim() || null : undefined,
      amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
      status: input.status,
      isPurchaseLandedCost: input.isPurchaseLandedCost,
    },
    include: { business: { select: { id: true, name: true, code: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_UPDATED",
    entity: "Expense",
    entityId: updated.id,
    newValues: { amount: updated.amount, status: updated.status },
  });

  return updated;
}

export async function deleteExpense(session: SessionPayload, expenseId: string) {
  await requireResourceAccess("Expense", expenseId, "DELETE");

  const deleted = await prisma.expense.delete({
    where: { id: expenseId },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_DELETED",
    entity: "Expense",
    entityId: deleted.id,
  });

  return { success: true };
}
