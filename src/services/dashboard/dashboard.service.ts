import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { Prisma, UserRole } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import {
  getFullProfitLossData,
  getFullBalanceSheetData,
} from "@/services/financials/financials.service";
import {
  DashboardQuery,
  DashboardResponseData,
  DashboardRange,
  DashboardChartPoint,
  BusinessPerformanceRecord,
} from "@/types/dashboard";

/**
 * Format a date into short UK format e.g. "10 AUG" or "OCT 26".
 */
function formatBucketDate(date: Date, isMonthly = false): string {
  if (isMonthly) {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "2-digit",
    })
      .format(date)
      .toUpperCase();
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .toUpperCase();
}

/**
 * Generate time buckets for the trading performance chart.
 */
function generateTimeBuckets(range: DashboardRange): Array<{
  label: string;
  startDate: Date;
  endDate: Date;
  hasMarker: boolean;
}> {
  const now = new Date();
  const buckets: Array<{
    label: string;
    startDate: Date;
    endDate: Date;
    hasMarker: boolean;
  }> = [];

  if (range === "7d") {
    // 7 daily intervals
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
      buckets.push({
        label: i === 0 ? "TODAY" : formatBucketDate(d),
        startDate: start,
        endDate: end,
        hasMarker: i % 2 === 0,
      });
    }
  } else if (range === "30d") {
    // 6 5-day intervals spanning 30 days
    const intervalDays = 5;
    for (let i = 5; i >= 0; i--) {
      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() - i * intervalDays);
      const dStart = new Date(dEnd);
      dStart.setDate(dStart.getDate() - (intervalDays - 1));

      const start = new Date(Date.UTC(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999));

      buckets.push({
        label: i === 0 ? "CURRENT" : formatBucketDate(dEnd),
        startDate: start,
        endDate: end,
        hasMarker: i === 0 || i === 5 || i === 3,
      });
    }
  } else if (range === "3m") {
    // 6 bi-weekly intervals spanning 90 days (15 days each)
    const intervalDays = 15;
    for (let i = 5; i >= 0; i--) {
      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() - i * intervalDays);
      const dStart = new Date(dEnd);
      dStart.setDate(dStart.getDate() - (intervalDays - 1));

      const start = new Date(Date.UTC(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999));

      buckets.push({
        label: i === 0 ? "CURRENT" : formatBucketDate(dEnd),
        startDate: start,
        endDate: end,
        hasMarker: i % 2 === 0,
      });
    }
  } else {
    // 1y: 12 monthly intervals
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      buckets.push({
        label: formatBucketDate(d, true),
        startDate: start,
        endDate: end,
        hasMarker: i % 3 === 0 || i === 0,
      });
    }
  }

  return buckets;
}

/**
 * Fetch and aggregate complete authoritative Dashboard dataset.
 */
export async function getDashboardData(
  session: SessionPayload,
  query: DashboardQuery = {}
): Promise<DashboardResponseData> {
  const { businessId, range = "30d" } = query;
  let businessFilter: Prisma.StringFilter | undefined;
  let businessScopeName = "All Businesses";

  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  const cacheKey = CacheKeys.dashboard.data(
    session.role,
    session.userId,
    businessId || "all",
    range || "30d"
  );

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    // 1. Parallel execution: authoritative P&L, Balance Sheet, Authorized Businesses
    const [pnlData, balanceSheetData, businessesList] = await Promise.all([
      getFullProfitLossData(session, {
        businessId: businessId && businessId !== "all" ? businessId : undefined,
      }),
      getFullBalanceSheetData(session, {
        businessId: businessId && businessId !== "all" ? businessId : undefined,
      }),
      prisma.business.findMany({
        where: businessFilter ? { id: businessFilter } : {},
        select: {
          id: true,
          name: true,
          code: true,
          businessType: true,
          description: true,
          status: true,
          totalInvestmentAED: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    if (businessId && businessId !== "all" && businessesList.length > 0) {
      businessScopeName = businessesList[0].name;
    }

    // 2. Compute KPIs
    const totalInvestmentAED = balanceSheetData.capital.totalCommittedCapitalAED;
    const purchaseCostAED = pnlData.kpis.purchaseCostAED;
    const totalExpensesAED = pnlData.kpis.totalExpensesAED;
    const totalSalesAED = pnlData.kpis.totalSalesAED;
    const netProfitAED = pnlData.kpis.netProfitAED;
    const netMarginPercent =
      totalSalesAED > 0 ? Number(((netProfitAED / totalSalesAED) * 100).toFixed(2)) : 0;

    // Sum profit allocated from authoritative settlement breakdown
    const profitAllocatedAED = balanceSheetData.settlementBreakdown.reduce(
      (sum, s) => sum + s.profitAmountAED,
      0
    );

    // 3. Compute Business Performance Table records
    // Map P&L business profitability items with Business metadata
    const pnlBizMap = new Map(pnlData.businesses.map((b) => [b.id, b]));
    const businessPerformance: BusinessPerformanceRecord[] = businessesList.map((biz) => {
      const pnlBiz = pnlBizMap.get(biz.id);
      const investmentAED = Number(biz.totalInvestmentAED || 0);
      const salesAED = pnlBiz ? pnlBiz.salesAED : 0;
      const purchaseAED = pnlBiz ? pnlBiz.purchaseAED : 0;
      const expensesAED = pnlBiz ? pnlBiz.expensesAED : 0;
      const bizNetProfit = pnlBiz ? pnlBiz.netProfitAED : 0;

      const partitionSubtitle = `${biz.code ? biz.code + " • " : ""}${
        biz.businessType ? biz.businessType.toUpperCase().replace(/_/g, " ") : "COMMODITY TRADING"
      }`;

      return {
        id: biz.id,
        name: biz.name,
        code: biz.code || "",
        businessType: biz.businessType || "COMMODITY_TRADING",
        partitionSubtitle,
        investmentAED,
        purchaseAED,
        salesAED,
        expensesAED,
        netProfitAED: bizNetProfit,
        status: (biz.status as "ACTIVE" | "PENDING" | "COMPLETED") || "ACTIVE",
      };
    });

    // 4. Compute Trading Performance time-series points
    const buckets = generateTimeBuckets(range);
    const earliestStart = buckets[0].startDate;
    const latestEnd = buckets[buckets.length - 1].endDate;

    // Fetch transactions matching exact P&L inclusion rules within range
    const [periodSales, periodPurchases, periodExpenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          saleDate: { gte: earliestStart, lte: latestEnd },
        },
        select: {
          saleDate: true,
          aedEquivalent: true,
        },
      }),
      prisma.purchase.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          purchaseDate: { gte: earliestStart, lte: latestEnd },
          status: { in: ["CLEARED", "IN_PROGRESS"] },
        },
        select: {
          purchaseDate: true,
          totalLandedCost: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          expenseDate: { gte: earliestStart, lte: latestEnd },
          isPurchaseLandedCost: false,
        },
        select: {
          expenseDate: true,
          amount: true,
        },
      }),
    ]);

    // Group transactions into buckets
    const points: DashboardChartPoint[] = buckets.map((bucket) => {
      const bucketSales = periodSales
        .filter((s) => s.saleDate >= bucket.startDate && s.saleDate <= bucket.endDate)
        .reduce((sum, s) => sum + Number(s.aedEquivalent || 0), 0);

      const bucketPurchase = periodPurchases
        .filter((p) => p.purchaseDate >= bucket.startDate && p.purchaseDate <= bucket.endDate)
        .reduce((sum, p) => sum + Number(p.totalLandedCost || 0), 0);

      const bucketExpenses = periodExpenses
        .filter((e) => e.expenseDate >= bucket.startDate && e.expenseDate <= bucket.endDate)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const bucketProfit = Math.max(0, bucketSales - bucketPurchase - bucketExpenses);

      return {
        date: bucket.label,
        sales: Math.round(bucketSales * 100) / 100,
        purchase: Math.round(bucketPurchase * 100) / 100,
        profit: Math.round(bucketProfit * 100) / 100,
        hasMarker: bucket.hasMarker,
      };
    });

    // 5. Compute Investor Overview data
    const externalSettlementItems = balanceSheetData.settlementBreakdown.filter(
      (s) => s.investorType === "INVESTOR" || !s.investorType
    );
    // If no explicit investor type filter applies, use all settlement items
    const relevantSettlementItems =
      externalSettlementItems.length > 0
        ? externalSettlementItems
        : balanceSheetData.settlementBreakdown;

    const uniqueInvestors = new Set(relevantSettlementItems.map((s) => s.investorId));
    const totalInvestorsCount = uniqueInvestors.size;
    const totalInvestedAED = relevantSettlementItems.reduce(
      (sum, s) => sum + s.totalInvestmentAED,
      0
    );
    const investorProfitAllocatedAED = relevantSettlementItems.reduce(
      (sum, s) => sum + s.profitAmountAED,
      0
    );
    const pendingSettlementAED = relevantSettlementItems.reduce(
      (sum, s) => sum + s.pendingOutstandingAED,
      0
    );

    return {
      success: true,
      scope: {
        selectedBusinessId: businessId || "all",
        businessName: businessScopeName,
        role: session.role === UserRole.ADMIN ? "ADMIN" : "PARTNER",
        asOfDate: new Date().toISOString().split("T")[0],
      },
      businesses: businessesList.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code || "",
      })),
      kpis: {
        totalInvestmentAED,
        purchaseCostAED,
        totalExpensesAED,
        totalSalesAED,
        netProfitAED,
        netMarginPercent,
        profitAllocatedAED,
      },
      businessPerformance,
      tradingPerformance: {
        range,
        points,
      },
      investorOverview: {
        totalInvestorsCount,
        totalInvestedAED,
        profitAllocatedAED: investorProfitAllocatedAED,
        pendingSettlementAED,
      },
    };
  });
}
