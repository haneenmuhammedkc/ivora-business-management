import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, requireResourceAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { logAuditEvent } from "@/lib/audit/audit.service";
import { Prisma, ExpensePaymentStatus } from "@prisma/client";
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
    category?: string;
    status?: ExpensePaymentStatus;
    search?: string;
  }
) {
  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    const cacheKey = CacheKeys.expenses.list(businessId, session.role, session.userId);

    // If query has specific dynamic search or sub-filters, fetch directly; otherwise use cache
    if (!filters?.category && !filters?.status && !filters?.search) {
      const expenses = await getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
        prisma.expense.findMany({
          where: { businessId },
          include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
          orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        })
      );
      return expenses.map(parseExpenseMetadata);
    }

    const expenses = await prisma.expense.findMany({
      where: {
        businessId,
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.search
          ? {
              OR: [
                { expenseCode: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
                { category: { contains: filters.search, mode: "insensitive" } },
                { paymentMethod: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    });
    return expenses.map(parseExpenseMetadata);
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
            { category: { contains: filters.search, mode: "insensitive" } },
            { paymentMethod: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (!filters?.category && !filters?.status && !filters?.search) {
    const cacheKey = CacheKeys.expenses.list(undefined, session.role, session.userId);
    const expenses = await getOrSetCache(cacheKey, CacheTTL.MEDIUM, () =>
      prisma.expense.findMany({
        where,
        include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      })
    );
    return expenses.map(parseExpenseMetadata);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });
  return expenses.map(parseExpenseMetadata);
}

/**
 * Parses conversion metadata from description if present.
 * Format: "User Description [INR 5,000 @ 0.03624]" or "(INR 5000 @ 0.03624)"
 */
export function parseExpenseMetadata<T extends { description?: string | null; amount: unknown }>(expense: T) {
  const desc = expense.description || "";
  const match = desc.match(/^(.*?)\s*(?:\[|\()INR\s*([\d,]+(?:\.\d+)?)\s*@\s*([\d.]+)\s*(?:AED\/INR)?(?:\]|\))\s*$/i);
  if (match) {
    const cleanDesc = match[1].trim();
    const inrAmount = parseFloat(match[2].replace(/,/g, ""));
    const rate = parseFloat(match[3]);
    return {
      ...expense,
      currency: "INR" as const,
      sourceAmount: inrAmount,
      conversionRate: rate,
      cleanDescription: cleanDesc || desc,
    };
  }
  return {
    ...expense,
    currency: "AED" as const,
    sourceAmount: Number(expense.amount),
    conversionRate: null as number | null,
    cleanDescription: desc,
  };
}

export async function getExpenseById(session: SessionPayload, expenseId: string) {
  await requireResourceAccess("Expense", expenseId, "READ", session);

  const cacheKey = CacheKeys.expenses.detail(expenseId);
  const expense = await getOrSetCache(cacheKey, CacheTTL.MEDIUM, async () => {
    return prisma.expense.findUnique({
      where: { id: expenseId },
      include: { business: { select: { id: true, name: true, code: true, businessType: true } } },
    });
  });

  return expense ? parseExpenseMetadata(expense) : null;
}

export async function createExpense(session: SessionPayload, rawInput: unknown) {
  const input = createExpenseSchema.parse(rawInput);
  await requireBusinessAccess(input.businessId, session, "WRITE");

  let finalDescription = input.description.trim();
  let settledAmountDecimal: Prisma.Decimal;

  if (input.currency === "INR" && input.sourceAmount && input.conversionRate) {
    const sourceDecimal = new Prisma.Decimal(input.sourceAmount);
    const rateDecimal = new Prisma.Decimal(input.conversionRate);
    if (sourceDecimal.lte(0) || rateDecimal.lte(0)) {
      throw new Error("Source INR amount and conversion rate must be greater than zero");
    }
    // Expense Amount (AED) = Expense Amount (INR) × Conversion Rate (AED per INR)
    settledAmountDecimal = sourceDecimal.mul(rateDecimal).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const formattedInr = sourceDecimal.toNumber().toLocaleString("en-IN");
    const cleanDesc = finalDescription.replace(/\s*(?:\[|\()INR\s*[\d,]+(?:\.\d+)?\s*@\s*[\d.]+\s*(?:AED\/INR)?(?:\]|\))\s*$/i, "").trim();
    finalDescription = cleanDesc ? `${cleanDesc} [INR ${formattedInr} @ ${rateDecimal.toString()}]` : `[INR ${formattedInr} @ ${rateDecimal.toString()}]`;
  } else {
    settledAmountDecimal = new Prisma.Decimal(input.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  const expense = await prisma.$transaction(async (tx) => {
    const expenseCode = await generateUniqueExpenseCode(tx);

    return tx.expense.create({
      data: {
        businessId: input.businessId,
        expenseCode,
        category: input.category,
        description: finalDescription,
        amount: settledAmountDecimal,
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
      amount: settledAmountDecimal.toNumber(),
      currency: input.currency,
      sourceAmount: input.sourceAmount,
      conversionRate: input.conversionRate,
      category: input.category,
      paymentMethod: input.paymentMethod,
      status: input.status,
    },
  });

  // Invalidate Redis caches
  await invalidateTransactionCaches(expense.businessId, "expenses", expense.id);

  return parseExpenseMetadata(expense);
}

export async function updateExpense(session: SessionPayload, expenseId: string, rawInput: unknown) {
  const input = updateExpenseSchema.parse(rawInput);
  const { resource: existing } = await requireResourceAccess<
    Prisma.ExpenseGetPayload<Record<string, never>>
  >("Expense", expenseId, "WRITE", session);

  if (input.businessId && input.businessId !== existing.businessId) {
    await requireBusinessAccess(input.businessId, session, "WRITE");
  }

  let finalDescription: string | undefined = input.description !== undefined ? input.description.trim() : undefined;
  let settledAmountDecimal: Prisma.Decimal | undefined = undefined;

  if (input.currency === "INR" && input.sourceAmount !== undefined && input.conversionRate !== undefined) {
    const sourceDecimal = new Prisma.Decimal(input.sourceAmount);
    const rateDecimal = new Prisma.Decimal(input.conversionRate);
    if (sourceDecimal.lte(0) || rateDecimal.lte(0)) {
      throw new Error("Source INR amount and conversion rate must be greater than zero");
    }
    // Expense Amount (AED) = Expense Amount (INR) × Conversion Rate (AED per INR)
    settledAmountDecimal = sourceDecimal.mul(rateDecimal).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const formattedInr = sourceDecimal.toNumber().toLocaleString("en-IN");
    const baseDesc = (finalDescription ?? existing.description).replace(/\s*(?:\[|\()INR\s*[\d,]+(?:\.\d+)?\s*@\s*[\d.]+\s*(?:AED\/INR)?(?:\]|\))\s*$/i, "").trim();
    finalDescription = baseDesc ? `${baseDesc} [INR ${formattedInr} @ ${rateDecimal.toString()}]` : `[INR ${formattedInr} @ ${rateDecimal.toString()}]`;
  } else if (input.currency === "AED") {
    if (input.amount !== undefined) {
      settledAmountDecimal = new Prisma.Decimal(input.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }
    if (finalDescription !== undefined) {
      finalDescription = finalDescription.replace(/\s*(?:\[|\()INR\s*[\d,]+(?:\.\d+)?\s*@\s*[\d.]+\s*(?:AED\/INR)?(?:\]|\))\s*$/i, "").trim();
    }
  } else if (input.amount !== undefined) {
    settledAmountDecimal = new Prisma.Decimal(input.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      businessId: input.businessId,
      category: input.category,
      description: finalDescription,
      amount: settledAmountDecimal,
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
      amount: settledAmountDecimal?.toNumber() ?? input.amount,
      currency: input.currency,
      sourceAmount: input.sourceAmount,
      conversionRate: input.conversionRate,
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

  return parseExpenseMetadata(updated);
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
