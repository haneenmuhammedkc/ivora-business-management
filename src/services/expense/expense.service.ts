import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, ExpenseCategory, ExpensePaymentStatus, UserRole } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateTransactionCaches } from "@/lib/redis/invalidation";

export interface CreateExpenseInput {
  businessId: string;
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
    await requireBusinessAccess(businessId, session);
    const cacheKey = CacheKeys.expenses.list(businessId);
    return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
      prisma.expense.findMany({
        where: { businessId },
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { expenseDate: "desc" },
      })
    );
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
  await requireBusinessAccess(input.businessId, session);

  const expense = await prisma.expense.create({
    data: {
      businessId: input.businessId,
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

  // Invalidate Redis caches
  await invalidateTransactionCaches(expense.businessId, "expenses", expense.id);

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

  // Invalidate Redis caches
  await invalidateTransactionCaches(updated.businessId, "expenses", updated.id);

  return updated;
}

export async function deleteExpense(session: SessionPayload, expenseId: string) {
  const { resource: existing } = await requireResourceAccess<Prisma.ExpenseGetPayload<Record<string, never>>>(
    "Expense",
    expenseId,
    "DELETE"
  );

  const deleted = await prisma.expense.delete({
    where: { id: expenseId },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_DELETED",
    entity: "Expense",
    entityId: deleted.id,
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(existing.businessId, "expenses", deleted.id);

  return { success: true };
}
