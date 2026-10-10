import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { AuthError } from "@/lib/auth/guards";
import { Prisma, UserRole, TransactionType } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import {
  DashboardQuery,
  DashboardResponseData,
  DashboardRange,
  DashboardChartPoint,
  BusinessPerformanceRecord,
  DashboardPartnerOption,
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
 * Fetch and aggregate complete authoritative Dashboard dataset scoped by Partner.
 */
export async function getDashboardData(
  session: SessionPayload,
  query: DashboardQuery = {}
): Promise<DashboardResponseData> {
  const { range = "30d" } = query;
  let targetPartnerId = query.partnerId;

  // 1. Authorization & Role Scoping
  if (session.role === UserRole.PARTNER) {
    if (targetPartnerId && targetPartnerId !== "all" && targetPartnerId !== session.userId) {
      throw new AuthError("You do not have permission to access another partner's dashboard", 403);
    }
    // Force Partner role to own scope
    targetPartnerId = session.userId;
  }

  // 2. Fetch Partner list for the selector
  let partnersList: DashboardPartnerOption[] = [];
  if (session.role === UserRole.ADMIN) {
    const partners = await prisma.user.findMany({
      where: { role: UserRole.PARTNER },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    partnersList = partners.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
    }));
  } else {
    const selfPartner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true },
    });
    if (selfPartner) {
      partnersList = [
        {
          id: selfPartner.id,
          name: selfPartner.name,
          email: selfPartner.email,
        },
      ];
    }
  }

  // 3. Resolve Partner Scope & Business IDs
  let partnerScopeName = "All Partners";
  let scopedBusinessFilter: Prisma.StringFilter | undefined;

  if (targetPartnerId && targetPartnerId !== "all") {
    const partnerUser = await prisma.user.findFirst({
      where: { id: targetPartnerId, role: UserRole.PARTNER },
      select: { id: true, name: true },
    });

    if (!partnerUser) {
      throw new AuthError("Partner not found", 404);
    }

    partnerScopeName = partnerUser.name;

    const partnerBusinesses = await prisma.business.findMany({
      where: { partnerId: targetPartnerId },
      select: { id: true },
    });

    const partnerBusinessIds = partnerBusinesses.map((b) => b.id);
    scopedBusinessFilter = { in: partnerBusinessIds };
  } else {
    // All Partners (Admin-wide)
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      scopedBusinessFilter = { in: authorized };
    }
  }

  // 4. Redis Cache Retrieval / Computation
  const cacheKey = CacheKeys.dashboard.data(
    session.role,
    session.userId,
    targetPartnerId || "all",
    range || "30d"
  );

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    // If business filter is scoped to an empty list of businesses (e.g. Partner has no businesses assigned)
    if (
      scopedBusinessFilter &&
      "in" in scopedBusinessFilter &&
      Array.isArray(scopedBusinessFilter.in) &&
      scopedBusinessFilter.in.length === 0
    ) {
      const buckets = generateTimeBuckets(range);
      return {
        success: true,
        scope: {
          selectedPartnerId: targetPartnerId || "all",
          partnerName: partnerScopeName,
          role: session.role === UserRole.ADMIN ? "ADMIN" : "PARTNER",
          asOfDate: new Date().toISOString().split("T")[0],
        },
        partners: partnersList,
        kpis: {
          totalInvestmentAED: 0,
          purchaseCostAED: 0,
          totalExpensesAED: 0,
          totalSalesAED: 0,
          netProfitAED: 0,
          netMarginPercent: 0,
          profitAllocatedAED: 0,
        },
        businessPerformance: [],
        tradingPerformance: {
          range,
          points: buckets.map((b) => ({
            date: b.label,
            sales: 0,
            purchase: 0,
            profit: 0,
            hasMarker: b.hasMarker,
          })),
        },
        investorOverview: {
          totalInvestorsCount: 0,
          totalInvestedAED: 0,
          profitAllocatedAED: 0,
          pendingSettlementAED: 0,
        },
      };
    }

    // Parallel fetch: Scoped Businesses, Sales, Purchases, Expenses, Investments, Settlements
    const [
      allScopedBusinesses,
      top3Businesses,
      allSales,
      allPurchases,
      allExpenses,
      allInvestments,
      allDisbursalTransactions,
    ] = await Promise.all([
      // A. All businesses in scope (for total capital sum)
      prisma.business.findMany({
        where: scopedBusinessFilter ? { id: scopedBusinessFilter } : {},
        select: {
          id: true,
          totalInvestmentAED: true,
        },
      }),

      // B. Top 3 latest created businesses in scope (ordered strictly by createdAt DESC)
      prisma.business.findMany({
        where: scopedBusinessFilter ? { id: scopedBusinessFilter } : {},
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          code: true,
          businessType: true,
          status: true,
          totalInvestmentAED: true,
          createdAt: true,
        },
      }),

      // C. All recognized sales in scope
      prisma.sale.findMany({
        where: scopedBusinessFilter ? { businessId: scopedBusinessFilter } : {},
        select: {
          businessId: true,
          saleDate: true,
          aedEquivalent: true,
        },
      }),

      // D. All cleared/in-progress purchases in scope
      prisma.purchase.findMany({
        where: {
          ...(scopedBusinessFilter ? { businessId: scopedBusinessFilter } : {}),
          status: { in: ["CLEARED", "IN_PROGRESS"] },
        },
        select: {
          businessId: true,
          purchaseDate: true,
          totalLandedCost: true,
        },
      }),

      // E. All operating expenses in scope (excluding purchase landed costs)
      prisma.expense.findMany({
        where: {
          ...(scopedBusinessFilter ? { businessId: scopedBusinessFilter } : {}),
          isPurchaseLandedCost: false,
        },
        select: {
          businessId: true,
          expenseDate: true,
          amount: true,
        },
      }),

      // F. All investments in scope for external investors & settlement
      prisma.investment.findMany({
        where: scopedBusinessFilter ? { businessId: scopedBusinessFilter } : {},
        select: {
          id: true,
          investorId: true,
          businessId: true,
          committedAmount: true,
          allocatedProfitAmount: true,
          profitSharePct: true,
          investor: {
            select: {
              id: true,
              type: true,
            },
          },
        },
      }),

      // G. Disbursal transactions for settlement pending calculation
      prisma.transaction.findMany({
        where: {
          ...(scopedBusinessFilter ? { businessId: scopedBusinessFilter } : {}),
          type: { in: [TransactionType.CAPITAL_RETURN, TransactionType.PROFIT_DISBURSAL] },
        },
        select: {
          investorId: true,
          businessId: true,
          amount: true,
        },
      }),
    ]);

    // 5. Compute Authoritative KPIs across scoped businesses
    const totalSalesAED = allSales.reduce(
      (sum, s) => sum + Number(s.aedEquivalent || 0),
      0
    );

    const purchaseCostAED = allPurchases.reduce(
      (sum, p) => sum + Number(p.totalLandedCost || 0),
      0
    );

    const totalExpensesAED = allExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const netProfitAED = Math.round((totalSalesAED - purchaseCostAED - totalExpensesAED) * 100) / 100;

    const netMarginPercent =
      totalSalesAED > 0
        ? Number(((netProfitAED / totalSalesAED) * 100).toFixed(2))
        : 0;

    const totalInvestmentAED = allScopedBusinesses.reduce(
      (sum, b) => sum + Number(b.totalInvestmentAED || 0),
      0
    );

    // Map business-level net profits for default profit allocations
    const businessSalesMap = new Map<string, number>();
    const businessPurchaseMap = new Map<string, number>();
    const businessExpenseMap = new Map<string, number>();

    for (const s of allSales) {
      businessSalesMap.set(s.businessId, (businessSalesMap.get(s.businessId) || 0) + Number(s.aedEquivalent || 0));
    }
    for (const p of allPurchases) {
      businessPurchaseMap.set(p.businessId, (businessPurchaseMap.get(p.businessId) || 0) + Number(p.totalLandedCost || 0));
    }
    for (const e of allExpenses) {
      businessExpenseMap.set(e.businessId, (businessExpenseMap.get(e.businessId) || 0) + Number(e.amount || 0));
    }

    const getBusinessNetProfit = (bId: string): number => {
      const s = businessSalesMap.get(bId) || 0;
      const p = businessPurchaseMap.get(bId) || 0;
      const e = businessExpenseMap.get(bId) || 0;
      return s - p - e;
    };

    // Calculate profit allocations across all investments in scope
    let totalProfitAllocatedAED = 0;
    for (const inv of allInvestments) {
      if (inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined) {
        totalProfitAllocatedAED += Number(inv.allocatedProfitAmount);
      } else {
        const bNet = Math.max(0, getBusinessNetProfit(inv.businessId));
        const share = Number(inv.profitSharePct) || 0;
        totalProfitAllocatedAED += (bNet * share) / 100;
      }
    }
    totalProfitAllocatedAED = Math.round(totalProfitAllocatedAED * 100) / 100;

    // 6. Compute Business Performance Table (Top 3 Latest Created Businesses)
    const businessPerformance: BusinessPerformanceRecord[] = top3Businesses.map((biz) => {
      const bSales = businessSalesMap.get(biz.id) || 0;
      const bPurchase = businessPurchaseMap.get(biz.id) || 0;
      const bExpenses = businessExpenseMap.get(biz.id) || 0;
      const bNetProfit = Math.round((bSales - bPurchase - bExpenses) * 100) / 100;

      const partitionSubtitle = `${biz.code ? biz.code + " • " : ""}${
        biz.businessType ? biz.businessType.toUpperCase().replace(/_/g, " ") : "COMMODITY TRADING"
      }`;

      return {
        id: biz.id,
        name: biz.name,
        code: biz.code || "",
        businessType: biz.businessType || "COMMODITY_TRADING",
        partitionSubtitle,
        investmentAED: Number(biz.totalInvestmentAED || 0),
        purchaseAED: Math.round(bPurchase * 100) / 100,
        salesAED: Math.round(bSales * 100) / 100,
        expensesAED: Math.round(bExpenses * 100) / 100,
        netProfitAED: bNetProfit,
        status: (biz.status as "ACTIVE" | "PENDING" | "COMPLETED") || "ACTIVE",
        createdAt: biz.createdAt.toISOString(),
      };
    });

    // 7. Compute Trading Performance Time-Series (Aggregated across all businesses in Partner scope)
    const buckets = generateTimeBuckets(range);
    const points: DashboardChartPoint[] = buckets.map((bucket) => {
      const bucketSales = allSales
        .filter((s) => s.saleDate >= bucket.startDate && s.saleDate <= bucket.endDate)
        .reduce((sum, s) => sum + Number(s.aedEquivalent || 0), 0);

      const bucketPurchase = allPurchases
        .filter((p) => p.purchaseDate >= bucket.startDate && p.purchaseDate <= bucket.endDate)
        .reduce((sum, p) => sum + Number(p.totalLandedCost || 0), 0);

      const bucketExpenses = allExpenses
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

    // 8. Compute Investor Overview (External Investors within Partner scope)
    const externalInvestments = allInvestments.filter(
      (inv) => inv.investor.type === "INVESTOR" || !inv.investor.type
    );
    const relevantInvestments =
      externalInvestments.length > 0 ? externalInvestments : allInvestments;

    const uniqueInvestorIds = new Set(relevantInvestments.map((inv) => inv.investorId));
    const totalInvestorsCount = uniqueInvestorIds.size;

    const totalInvestedAED = relevantInvestments.reduce(
      (sum, inv) => sum + Number(inv.committedAmount || 0),
      0
    );

    let externalProfitAllocatedAED = 0;
    for (const inv of relevantInvestments) {
      if (inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined) {
        externalProfitAllocatedAED += Number(inv.allocatedProfitAmount);
      } else {
        const bNet = Math.max(0, getBusinessNetProfit(inv.businessId));
        const share = Number(inv.profitSharePct) || 0;
        externalProfitAllocatedAED += (bNet * share) / 100;
      }
    }
    externalProfitAllocatedAED = Math.round(externalProfitAllocatedAED * 100) / 100;

    // Sum total disbursed to these relevant investments
    const totalDisbursedAED = allDisbursalTransactions
      .filter((tx) => Boolean(tx.investorId && uniqueInvestorIds.has(tx.investorId)))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const pendingSettlementAED = Math.max(
      0,
      Math.round((totalInvestedAED + externalProfitAllocatedAED - totalDisbursedAED) * 100) / 100
    );

    return {
      success: true,
      scope: {
        selectedPartnerId: targetPartnerId || "all",
        partnerName: partnerScopeName,
        role: session.role === UserRole.ADMIN ? "ADMIN" : "PARTNER",
        asOfDate: new Date().toISOString().split("T")[0],
      },
      partners: partnersList,
      kpis: {
        totalInvestmentAED: Math.round(totalInvestmentAED * 100) / 100,
        purchaseCostAED: Math.round(purchaseCostAED * 100) / 100,
        totalExpensesAED: Math.round(totalExpensesAED * 100) / 100,
        totalSalesAED: Math.round(totalSalesAED * 100) / 100,
        netProfitAED,
        netMarginPercent,
        profitAllocatedAED: totalProfitAllocatedAED,
      },
      businessPerformance,
      tradingPerformance: {
        range,
        points,
      },
      investorOverview: {
        totalInvestorsCount,
        totalInvestedAED: Math.round(totalInvestedAED * 100) / 100,
        profitAllocatedAED: externalProfitAllocatedAED,
        pendingSettlementAED,
      },
    };
  });
}
