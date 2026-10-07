import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { Prisma } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";

export async function getProfitLossSummary(session: SessionPayload, businessId?: string) {
  let businessFilter: Prisma.StringFilter | undefined;

  if (businessId) {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  const cacheKey = CacheKeys.financials.pnl(businessId, session.userId, session.role);

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    const [purchases, sales, expenses] = await Promise.all([
      prisma.purchase.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { totalLandedCost: true },
      }),
      prisma.sale.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { aedEquivalent: true },
      }),
      prisma.expense.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { amount: true },
      }),
    ]);

    const totalAcquisitionCostAed = purchases.reduce((acc: number, p: { totalLandedCost: Prisma.Decimal | null }) => acc + Number(p.totalLandedCost || 0), 0);
    const totalRevenueAed = sales.reduce((acc: number, s: { aedEquivalent: Prisma.Decimal }) => acc + Number(s.aedEquivalent), 0);
    const totalExpensesAed = expenses.reduce((acc: number, e: { amount: Prisma.Decimal }) => acc + Number(e.amount), 0);

    const grossArbitrageSpreadAed = totalRevenueAed - totalAcquisitionCostAed;
    const netProfitAed = grossArbitrageSpreadAed - totalExpensesAed;
    const marginPercentage = totalRevenueAed > 0 ? (netProfitAed / totalRevenueAed) * 100 : 0;

    return {
      totalRevenueAed,
      totalAcquisitionCostAed,
      grossArbitrageSpreadAed,
      totalExpensesAed,
      netProfitAed,
      marginPercentage: Number(marginPercentage.toFixed(2)),
    };
  });
}

export async function getBalanceSheetSummary(session: SessionPayload, businessId?: string) {
  let businessFilter: Prisma.StringFilter | undefined;

  if (businessId) {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  const cacheKey = CacheKeys.financials.balanceSheet(businessId, session.userId, session.role);

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    const [investments, transactions, businesses] = await Promise.all([
      prisma.investment.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { committedAmount: true, status: true },
      }),
      prisma.transaction.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { amount: true, type: true },
      }),
      prisma.business.findMany({
        where: businessFilter ? { id: businessFilter } : {},
        select: { id: true, name: true, code: true, partnerEquityPct: true },
      }),
    ]);

    const totalCommittedCapital = investments.reduce((acc: number, i: { committedAmount: Prisma.Decimal; status: string }) => acc + Number(i.committedAmount), 0);
    const totalInwardCapital = transactions
      .filter((t: { type: string; amount: Prisma.Decimal }) => t.type === "CAPITAL_INWARD")
      .reduce((acc: number, t: { type: string; amount: Prisma.Decimal }) => acc + Number(t.amount), 0);
    const totalProfitDisbursed = transactions
      .filter((t: { type: string; amount: Prisma.Decimal }) => t.type === "PROFIT_DISBURSAL")
      .reduce((acc: number, t: { type: string; amount: Prisma.Decimal }) => acc + Number(t.amount), 0);

    return {
      totalCommittedCapital,
      totalInwardCapital,
      totalProfitDisbursed,
      activeEntitiesCount: businesses.length,
      businesses,
    };
  });
}

export async function getReportData(session: SessionPayload, businessId?: string) {
  let businessFilter: Prisma.StringFilter | undefined;

  if (businessId) {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  const cacheKey = CacheKeys.financials.reports(businessId, session.userId, session.role);

  return getOrSetCache(cacheKey, CacheTTL.MEDIUM, async () => {
    const [purchases, sales, expenses] = await Promise.all([
      prisma.purchase.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { purchaseCode: true, quantityGms: true, totalLandedCost: true, purchaseDate: true },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.sale.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { saleCode: true, quantityGms: true, aedEquivalent: true, saleDate: true },
        orderBy: { saleDate: "desc" },
      }),
      prisma.expense.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { expenseCode: true, category: true, amount: true, expenseDate: true },
        orderBy: { expenseDate: "desc" },
      }),
    ]);

    return {
      purchasesSummary: purchases,
      salesSummary: sales,
      expensesSummary: expenses,
    };
  });
}
