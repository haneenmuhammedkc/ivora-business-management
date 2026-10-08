import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, ExpenseCategory, ExpensePaymentStatus } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { invalidateTransactionCaches } from "@/lib/redis/invalidation";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/validators/expense.validator";

/**
 * Generate a unique sequential expense code, e.g. EXP-0001, EXP-0024.
 */
export async function generateUniqueExpenseCode(
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const latest = await tx.expense.findFirst({
    orderBy: { createdAt: "desc" },
    select: { expenseCode: true },
  });

  let nextNum = 1;
  if (latest?.expenseCode) {
    const match = latest.expenseCode.match(/\bEXP-(\d+)\b/i);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    } else {
      const count = await tx.expense.count();
      nextNum = count + 1;
    }
  } else {
    const count = await tx.expense.count();
    nextNum = count + 1;
  }

  let code = `EXP-${String(nextNum).padStart(4, "0")}`;
  let attempt = 0;
  while (await tx.expense.findUnique({ where: { expenseCode: code } })) {
    attempt++;
    code = `EXP-${String(nextNum + attempt).padStart(4, "0")}`;
  }

  return code;
}

export async function listExpenses(
  session: SessionPayload,
  businessId?: string,
  filters?: {
    category?: ExpenseCategory;
    status?: ExpensePaymentStatus;
    search?: string;
  }
) {
  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    const cacheKey = CacheKeys.expenses.list(businessId, session.role, session.userId);

    // If query has specific dynamic search or sub-filters, fetch directly; otherwise use cache
    if (!filters?.category && !filters?.status && !filters?.search) {
      return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
        prisma.expense.findMany({
          where: { businessId },
          include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
          orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        })
      );
    }

    return prisma.expense.findMany({
      where: {
        businessId,
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search
          ? {
              OR: [
                { expenseCode: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
                { paymentMethod: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    });
  }

  const authorized = await getAuthorizedBusinessIds(session);
  const where: Prisma.ExpenseWhereInput = {
    ...(authorized !== "ALL" ? { businessId: { in: authorized } } : {}),
    ...(filters?.category ? { category: filters.category } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.search
      ? {
          OR: [
            { expenseCode: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
            { paymentMethod: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (!filters?.category && !filters?.status && !filters?.search) {
    const cacheKey = CacheKeys.expenses.list(undefined, session.role, session.userId);
    return getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
      prisma.expense.findMany({
        where,
        include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      })
    );
  }

  return prisma.expense.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function getExpenseById(session: SessionPayload, expenseId: string) {
  await requireResourceAccess("Expense", expenseId, "READ", session);

  const cacheKey = CacheKeys.expenses.detail(expenseId);
  return getOrSetCache(cacheKey, CacheTTL.MEDIUM, async () => {
    return prisma.expense.findUnique({
      where: { id: expenseId },
      include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
    });
  });
}

export async function createExpense(session: SessionPayload, rawInput: unknown) {
  const input = createExpenseSchema.parse(rawInput);
  await requireBusinessAccess(input.businessId, session);

  const expense = await prisma.$transaction(async (tx) => {
    const expenseCode = await generateUniqueExpenseCode(tx);

    return tx.expense.create({
      data: {
        businessId: input.businessId,
        expenseCode,
        category: input.category,
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        expenseDate: input.expenseDate,
        status: input.status,
        paymentMethod: input.paymentMethod,
        isPurchaseLandedCost: input.isPurchaseLandedCost,
      },
      include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
    });
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_CREATED",
    entity: "Expense",
    entityId: expense.id,
    newValues: {
      code: expense.expenseCode,
      businessId: expense.businessId,
      amount: input.amount,
      category: input.category,
      paymentMethod: input.paymentMethod,
      status: input.status,
    },
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(expense.businessId, "expenses", expense.id);

  return expense;
}

export async function updateExpense(session: SessionPayload, expenseId: string, rawInput: unknown) {
  const input = updateExpenseSchema.parse(rawInput);
  const { resource: existing } = await requireResourceAccess<
    Prisma.ExpenseGetPayload<Record<string, never>>
  >("Expense", expenseId, "WRITE", session);

  if (input.businessId && input.businessId !== existing.businessId) {
    await requireBusinessAccess(input.businessId, session);
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      businessId: input.businessId,
      category: input.category,
      description: input.description,
      amount: input.amount !== undefined ? new Prisma.Decimal(input.amount) : undefined,
      expenseDate: input.expenseDate,
      status: input.status,
      paymentMethod: input.paymentMethod,
      isPurchaseLandedCost: input.isPurchaseLandedCost,
    },
    include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
  });

  await logAuditEvent({
    userId: session.userId,
    action: "EXPENSE_UPDATED",
    entity: "Expense",
    entityId: updated.id,
    newValues: {
      amount: input.amount,
      category: input.category,
      status: input.status,
      paymentMethod: input.paymentMethod,
    },
  });

  // Invalidate Redis caches (including previous business cache if business changed)
  await invalidateTransactionCaches(updated.businessId, "expenses", updated.id);
  if (existing.businessId !== updated.businessId) {
    await invalidateTransactionCaches(existing.businessId, "expenses", updated.id);
  }

  return updated;
}

export async function deleteExpense(session: SessionPayload, expenseId: string) {
  const { resource: existing } = await requireResourceAccess<
    Prisma.ExpenseGetPayload<Record<string, never>>
  >("Expense", expenseId, "DELETE", session);

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
