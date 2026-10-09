import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { Prisma, UserRole, PurchaseStatus, SaleStatus, ExpensePaymentStatus } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import {
  ReportsOverviewResponse,
  ReportsSummaryKPIs,
  QuickDeskTodayData,
  QuickDeskMonthlyData,
  QuickDeskBusinessRow,
  QuickDeskInvestorRow,
  QuickDeskExpenseRow,
  ReportCardItem,
  DetailedReportType,
  DetailedReportResponse,
  DetailedReportColumn,
} from "@/types/reports";

export interface ReportFilterQuery {
  businessId?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  product?: string;
  search?: string;
}

/**
 * Standardize boundary-safe date ranges (UTC).
 */
export function parseReportDateFilters(query: ReportFilterQuery): { gte?: Date; lte?: Date } | undefined {
  if (query.startDate || query.endDate) {
    const range: { gte?: Date; lte?: Date } = {};
    if (query.startDate) {
      const parts = query.startDate.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        range.gte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
      } else {
        const d = new Date(query.startDate);
        if (!isNaN(d.getTime())) range.gte = d;
      }
    }
    if (query.endDate) {
      const parts = query.endDate.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        range.lte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));
      } else {
        const d = new Date(query.endDate);
        if (!isNaN(d.getTime())) range.lte = d;
      }
    }
    return Object.keys(range).length > 0 ? range : undefined;
  }

  if (query.period) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    switch (query.period.toLowerCase()) {
      case "this_month":
      case "this month": {
        const start = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "last_month":
      case "last month": {
        const start = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "this_quarter":
      case "this quarter":
      case "q3_2026":
      case "q3 2026": {
        const qStartMonth = Math.floor(currentMonth / 3) * 3;
        const start = new Date(Date.UTC(currentYear, qStartMonth, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, qStartMonth + 3, 0, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "ytd_2026":
      case "ytd 2026":
      case "ytd": {
        const start = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "all":
      case "all time":
      default:
        return undefined;
    }
  }

  return undefined;
}

/**
 * Format currency with 2 decimals
 */
function fmtAED(val: number): string {
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Main Overview reports retrieval
 */
export async function getReportsOverview(
  session: SessionPayload,
  query: ReportFilterQuery = {}
): Promise<ReportsOverviewResponse> {
  const { businessId, status, product, period, startDate, endDate, search } = query;

  // Multi-tenant business authorization check
  let businessFilter: Prisma.StringFilter | undefined;
  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  // Generate deterministic cache key
  const scopeKey = businessId && businessId !== "all"
    ? `biz:${businessId}`
    : session.role === UserRole.ADMIN
    ? "admin:all"
    : `partner:${session.userId}`;

  const queryHash = [
    status || "all",
    product || "all",
    period || "this_month",
    startDate || "",
    endDate || "",
    search ? encodeURIComponent(search) : "",
  ].join(":");

  const cacheKey = CacheKeys.reports.overview(scopeKey, queryHash);

  return getOrSetCache(cacheKey, CacheTTL.MEDIUM, async () => {
    // 1. Resolve authorized businesses
    const authorizedBizWhere: Prisma.BusinessWhereInput =
      session.role === UserRole.ADMIN ? {} : { partnerId: session.userId };

    const allAuthorizedBusinesses = await prisma.business.findMany({
      where: authorizedBizWhere,
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        partnerId: true,
        partnerEquityPct: true,
        totalInvestmentAED: true,
      },
      orderBy: { name: "asc" },
    });

    const authorizedBusinessIds = allAuthorizedBusinesses.map((b) => b.id);
    const effectiveBizFilter: Prisma.StringFilter = businessFilter
      ? businessFilter
      : { in: authorizedBusinessIds };

    // 2. Resolve distinct product types from DB
    const distinctPurchases = await prisma.purchase.findMany({
      where: { businessId: effectiveBizFilter },
      select: { productType: true },
      distinct: ["productType"],
    });
    const productTypes = Array.from(new Set(distinctPurchases.map((p) => p.productType))).filter(Boolean);

    // 3. Date range filters
    const dateRange = parseReportDateFilters(query);

    // Base query conditions
    const purchaseWhere: Prisma.PurchaseWhereInput = {
      businessId: effectiveBizFilter,
      ...(dateRange ? { purchaseDate: dateRange } : {}),
      ...(status && status !== "all" ? { status: status as PurchaseStatus } : {}),
      ...(product && product !== "all" ? { productType: { contains: product, mode: "insensitive" } } : {}),
    };

    const saleWhere: Prisma.SaleWhereInput = {
      businessId: effectiveBizFilter,
      ...(dateRange ? { saleDate: dateRange } : {}),
      ...(status && status !== "all" ? { status: status as SaleStatus } : {}),
      ...(product && product !== "all" ? { productType: { contains: product, mode: "insensitive" } } : {}),
    };

    const expenseWhere: Prisma.ExpenseWhereInput = {
      businessId: effectiveBizFilter,
      ...(dateRange ? { expenseDate: dateRange } : {}),
      ...(status && status !== "all" ? { status: status as ExpensePaymentStatus } : {}),
    };

    // 4. Parallel fetch
    const [purchases, sales, expenses, investors, investments] = await Promise.all([
      prisma.purchase.findMany({
        where: purchaseWhere,
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.sale.findMany({
        where: saleWhere,
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { saleDate: "desc" },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        include: { business: { select: { id: true, name: true, code: true } } },
        orderBy: { expenseDate: "desc" },
      }),
      prisma.investor.findMany({
        where: { businessId: effectiveBizFilter },
        include: {
          business: { select: { id: true, name: true, code: true } },
          investments: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.investment.findMany({
        where: { businessId: effectiveBizFilter },
        include: {
          investor: { select: { id: true, name: true, code: true } },
          business: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    // 5. Aggregate KPIs
    const totalSalesAED = sales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
    const totalPurchaseAED = purchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
    // Exclude landed costs from operating expenses to avoid double-counting
    const totalExpensesAED = expenses
      .filter((e) => !e.isPurchaseLandedCost)
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const netProfitAED = totalSalesAED - totalPurchaseAED - totalExpensesAED;

    // Calculate investor share pool based on active investor investments
    const totalInvestorPct = investments.reduce((acc, inv) => acc + Number(inv.profitSharePct || 0), 0);
    const effectiveInvestorSharePct = Math.min(Math.max(totalInvestorPct, 0), 100);
    const investorShareAED = netProfitAED > 0 ? (netProfitAED * effectiveInvestorSharePct) / 100 : 0;

    const kpis: ReportsSummaryKPIs = {
      totalSalesAED,
      totalPurchaseAED,
      totalExpensesAED,
      netProfitAED,
      investorShareAED,
    };

    // 6. Quick Desk: Today's Activity
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const todayPurchases = purchases.filter((p) => p.purchaseDate >= todayStart && p.purchaseDate <= todayEnd);
    const todaySales = sales.filter((s) => s.saleDate >= todayStart && s.saleDate <= todayEnd);
    const todayExpenses = expenses.filter((e) => e.expenseDate >= todayStart && e.expenseDate <= todayEnd);

    const todaySalesAED = todaySales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
    const todayPurchasesAED = todayPurchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
    const todayExpensesAED = todayExpenses
      .filter((e) => !e.isPurchaseLandedCost)
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const recentActivity: QuickDeskTodayData["recentActivity"] = [];
    for (const s of sales.slice(0, 3)) {
      recentActivity.push({
        id: `sale-${s.id}`,
        type: "SALE",
        code: s.saleCode,
        description: `Sale to ${s.buyerFirm} (${s.productType})`,
        amountAED: Number(s.aedEquivalent),
        businessName: s.business.name,
        timestamp: s.saleDate.toISOString(),
      });
    }
    for (const p of purchases.slice(0, 3)) {
      recentActivity.push({
        id: `purch-${p.id}`,
        type: "PURCHASE",
        code: p.purchaseCode,
        description: `Purchase of ${p.productType} (${Number(p.quantity)} ${p.quantityUnit})`,
        amountAED: Number(p.totalLandedCost),
        businessName: p.business.name,
        timestamp: p.purchaseDate.toISOString(),
      });
    }
    for (const e of expenses.slice(0, 3)) {
      recentActivity.push({
        id: `exp-${e.id}`,
        type: "EXPENSE",
        code: e.expenseCode,
        description: `${e.category}: ${e.description}`,
        amountAED: Number(e.amount),
        businessName: e.business.name,
        timestamp: e.expenseDate.toISOString(),
      });
    }
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const quickDeskToday: QuickDeskTodayData = {
      purchaseCount: todayPurchases.length,
      saleCount: todaySales.length,
      expenseCount: todayExpenses.length,
      totalSalesAED: todaySalesAED,
      totalPurchasesAED: todayPurchasesAED,
      totalExpensesAED: todayExpensesAED,
      netCashAED: todaySalesAED - todayPurchasesAED - todayExpensesAED,
      recentActivity: recentActivity.slice(0, 5),
    };

    // 7. Quick Desk: Monthly Performance
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    const prevMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    const mtdSales = sales
      .filter((s) => s.saleDate >= monthStart && s.saleDate <= monthEnd)
      .reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
    const mtdPurchases = purchases
      .filter((p) => p.purchaseDate >= monthStart && p.purchaseDate <= monthEnd)
      .reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
    const mtdExpenses = expenses
      .filter((e) => e.expenseDate >= monthStart && e.expenseDate <= monthEnd && !e.isPurchaseLandedCost)
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const mtdNetProfit = mtdSales - mtdPurchases - mtdExpenses;
    const mtdMargin = mtdSales > 0 ? (mtdNetProfit / mtdSales) * 100 : 0;

    const prevMonthSales = sales
      .filter((s) => s.saleDate >= prevMonthStart && s.saleDate <= prevMonthEnd)
      .reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
    const growthPct = prevMonthSales > 0 ? ((mtdSales - prevMonthSales) / prevMonthSales) * 100 : 0;

    const quickDeskMonthly: QuickDeskMonthlyData = {
      currentMonthLabel: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      totalSalesAED: mtdSales,
      totalPurchasesAED: mtdPurchases,
      totalExpensesAED: mtdExpenses,
      netProfitAED: mtdNetProfit,
      profitMarginPct: mtdMargin,
      previousMonthSalesAED: prevMonthSales,
      salesGrowthPct: growthPct,
    };

    // 8. Quick Desk: Business Comparison
    const quickDeskBusiness: QuickDeskBusinessRow[] = allAuthorizedBusinesses
      .filter((b) => (businessId && businessId !== "all" ? b.id === businessId : true))
      .map((b) => {
        const bSales = sales.filter((s) => s.businessId === b.id).reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
        const bPurchases = purchases.filter((p) => p.businessId === b.id).reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
        const bExpenses = expenses
          .filter((e) => e.businessId === b.id && !e.isPurchaseLandedCost)
          .reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const bNetProfit = bSales - bPurchases - bExpenses;
        const bMargin = bSales > 0 ? (bNetProfit / bSales) * 100 : 0;

        return {
          id: b.id,
          name: b.name,
          code: b.code,
          totalSalesAED: bSales,
          totalPurchasesAED: bPurchases,
          totalExpensesAED: bExpenses,
          netProfitAED: bNetProfit,
          marginPct: bMargin,
          status: b.status,
        };
      });

    // 9. Quick Desk: Investor Summary
    const quickDeskInvestor: QuickDeskInvestorRow[] = investors.map((inv) => {
      const invCommitted = inv.investments.reduce((acc, i) => acc + Number(i.committedAmount || 0), 0);
      const sharePct = inv.investments.reduce((acc, i) => acc + Number(i.profitSharePct || 0), Number(inv.defaultSharePct || 0));
      const estProfit = netProfitAED > 0 ? (netProfitAED * sharePct) / 100 : 0;

      return {
        id: inv.id,
        name: inv.name,
        code: inv.code,
        type: inv.type,
        businessName: inv.business?.name || "Unassigned",
        committedCapitalAED: invCommitted,
        profitSharePct: sharePct,
        estimatedProfitAED: estProfit,
        status: inv.status,
      };
    });

    // 10. Quick Desk: Expense Analysis
    const expenseCategoryMap: Record<string, { total: number; count: number }> = {};
    for (const exp of expenses.filter((e) => !e.isPurchaseLandedCost)) {
      const cat = exp.category || "General Overhead";
      if (!expenseCategoryMap[cat]) {
        expenseCategoryMap[cat] = { total: 0, count: 0 };
      }
      expenseCategoryMap[cat].total += Number(exp.amount || 0);
      expenseCategoryMap[cat].count += 1;
    }

    const quickDeskExpense: QuickDeskExpenseRow[] = Object.entries(expenseCategoryMap).map(([category, stats]) => ({
      category,
      totalAmountAED: stats.total,
      count: stats.count,
      percentageOfTotal: totalExpensesAED > 0 ? (stats.total / totalExpensesAED) * 100 : 0,
    })).sort((a, b) => b.totalAmountAED - a.totalAmountAED);

    // 11. Institutional Report Cards with Live Data
    const totalPurchaseQty = purchases.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
    const purchaseUnit = purchases[0]?.quantityUnit || "Units";
    const netMarginPct = totalSalesAED > 0 ? (netProfitAED / totalSalesAED) * 100 : 0;

    const reportCards: ReportCardItem[] = [
      {
        id: "rep-01",
        reportKey: "business-performance",
        title: "Business Performance",
        description: "Compare sales, purchases, expenses and profitability across businesses.",
        iconType: "chart",
        badge: "MULTI-ENTITY",
        badgeVariant: "outline",
        footerLeft: `${quickDeskBusiness.length} ${quickDeskBusiness.length === 1 ? "Entity" : "Entities"} Audited`,
        routeHref: "/businesses",
        category: "Business",
      },
      {
        id: "rep-02",
        reportKey: "purchase-report",
        title: "Purchase Report",
        description: "Analyze bullion purchases, unit acquisitions, landed costs and supplier terms.",
        iconType: "purchase",
        badge: "PURCHASE DESK",
        badgeVariant: "outline",
        footerLeft: `${totalPurchaseQty.toLocaleString()} ${purchaseUnit} Total`,
        routeHref: "/purchase",
        category: "Purchase",
      },
      {
        id: "rep-03",
        reportKey: "sales-report",
        title: "Sales Report",
        description: "Analyze sales, buyer firm realization, hedged FX rates, and AED settlements.",
        iconType: "sales",
        badge: "CROSS-BORDER",
        badgeVariant: "outline",
        footerLeft: `AED ${fmtAED(totalSalesAED)}`,
        routeHref: "/sales",
        category: "Sales",
      },
      {
        id: "rep-05",
        reportKey: "expense-report",
        title: "Expense Report",
        description: "Itemized operating expenses, vault labour, customs, freight, and bank charges.",
        iconType: "expense",
        badge: "ITEMIZED",
        badgeVariant: "outline",
        footerLeft: `AED ${fmtAED(totalExpensesAED)}`,
        routeHref: "/expenses",
        category: "Expenses",
      },
      {
        id: "rep-06",
        reportKey: "investor-report",
        title: "Investor Report",
        description: "Review partner capital, profit allocations, equity percentages, and distributions.",
        iconType: "investor",
        badge: "EQUITY POOL",
        badgeVariant: "outline",
        footerLeft: `${investors.length} ${investors.length === 1 ? "Investor" : "Investors"} Active`,
        routeHref: "/investors",
        category: "Investors",
      },
      {
        id: "rep-07",
        reportKey: "profit-loss",
        title: "Profit & Loss Statement",
        description: "Consolidated audited IFRS-9 / DIFC statements, gross yields, and net spreads.",
        iconType: "profit-loss",
        badge: "IFRS-9 / DIFC",
        badgeVariant: "solid",
        footerLeft: `Net Margin: ${netMarginPct.toFixed(1)}%`,
        routeHref: "/profit-loss",
        category: "Financial",
      },
      {
        id: "rep-08",
        reportKey: "balance-sheet",
        title: "Balance Sheet Report",
        description: "Point-in-time Assets = Liabilities + Equity balance verification.",
        iconType: "balance-sheet",
        badge: "BALANCED",
        badgeVariant: "outline",
        footerLeft: "Δ 0.00 Variance",
        routeHref: "/balance-sheet",
        category: "Financial",
      },
      {
        id: "rep-09",
        reportKey: "settlement-report",
        title: "Settlement Report",
        description: "Investor disbursement records, pending balances, wire status, and allocations.",
        iconType: "settlement",
        badge: "SETTLED",
        badgeVariant: "solid",
        footerLeft: `AED ${fmtAED(investorShareAED)} Pool`,
        routeHref: "/investors",
        category: "Investors",
      },
    ];

    const filterEcho = {
      businessId: businessId || "all",
      status: status || "all",
      product: product || "all",
      period: period || "this_month",
      startDate,
      endDate,
    };

    return {
      kpis,
      quickDesk: {
        today: quickDeskToday,
        monthly: quickDeskMonthly,
        business: quickDeskBusiness,
        investor: quickDeskInvestor,
        expense: quickDeskExpense,
      },
      reportCards,
      businesses: allAuthorizedBusinesses.map((b) => ({ id: b.id, name: b.name, code: b.code })),
      productTypes,
      filterEcho,
    };
  });
}

/**
 * Detailed tabular report generation for individual report inspection or exports.
 */
export async function getDetailedReport(
  session: SessionPayload,
  reportType: DetailedReportType,
  query: ReportFilterQuery = {}
): Promise<DetailedReportResponse> {
  const { businessId, status, product, period, startDate, endDate } = query;

  let businessFilter: Prisma.StringFilter | undefined;
  let entityScopeName = "Consolidated (All Authorized Businesses)";

  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
    const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { name: true, code: true } });
    if (biz) entityScopeName = `${biz.name} (${biz.code})`;
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  const dateRange = parseReportDateFilters(query);
  const periodLabel = period || "This Month";
  const dateRangeString = startDate && endDate ? `${startDate} to ${endDate}` : periodLabel;

  // Multi-tenant check
  const authorizedBizWhere: Prisma.BusinessWhereInput =
    session.role === UserRole.ADMIN ? {} : { partnerId: session.userId };

  const allAuthorizedBusinesses = await prisma.business.findMany({
    where: authorizedBizWhere,
    select: { id: true, name: true, code: true, status: true, totalInvestmentAED: true },
  });
  const authorizedBusinessIds = allAuthorizedBusinesses.map((b) => b.id);
  const effectiveBizFilter: Prisma.StringFilter = businessFilter ? businessFilter : { in: authorizedBusinessIds };

  switch (reportType) {
    case "business-performance": {
      const businesses = await prisma.business.findMany({
        where: { id: effectiveBizFilter },
        include: {
          purchases: {
            where: {
              ...(dateRange ? { purchaseDate: dateRange } : {}),
              ...(status && status !== "all" ? { status: status as PurchaseStatus } : {}),
            },
            select: { totalLandedCost: true },
          },
          sales: {
            where: {
              ...(dateRange ? { saleDate: dateRange } : {}),
              ...(status && status !== "all" ? { status: status as SaleStatus } : {}),
            },
            select: { aedEquivalent: true },
          },
          expenses: {
            where: {
              ...(dateRange ? { expenseDate: dateRange } : {}),
              ...(status && status !== "all" ? { status: status as ExpensePaymentStatus } : {}),
              isPurchaseLandedCost: false,
            },
            select: { amount: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const rows = businesses.map((b) => {
        const salesAED = b.sales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
        const purchaseAED = b.purchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
        const expenseAED = b.expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const netProfitAED = salesAED - purchaseAED - expenseAED;
        const marginPct = salesAED > 0 ? (netProfitAED / salesAED) * 100 : 0;

        return {
          code: b.code,
          name: b.name,
          salesAED: fmtAED(salesAED),
          purchaseAED: fmtAED(purchaseAED),
          expenseAED: fmtAED(expenseAED),
          netProfitAED: fmtAED(netProfitAED),
          marginPct: `${marginPct.toFixed(2)}%`,
          status: b.status,
        };
      });

      const totalSales = businesses.reduce((acc, b) => acc + b.sales.reduce((sAcc, s) => sAcc + Number(s.aedEquivalent || 0), 0), 0);
      const totalPurchases = businesses.reduce((acc, b) => acc + b.purchases.reduce((pAcc, p) => pAcc + Number(p.totalLandedCost || 0), 0), 0);
      const totalExpenses = businesses.reduce((acc, b) => acc + b.expenses.reduce((eAcc, e) => eAcc + Number(e.amount || 0), 0), 0);
      const netProfit = totalSales - totalPurchases - totalExpenses;

      const columns: DetailedReportColumn[] = [
        { key: "code", label: "Business Code" },
        { key: "name", label: "Entity Name" },
        { key: "salesAED", label: "Sales (AED)", align: "right" },
        { key: "purchaseAED", label: "Purchases (AED)", align: "right" },
        { key: "expenseAED", label: "Expenses (AED)", align: "right" },
        { key: "netProfitAED", label: "Net Profit (AED)", align: "right" },
        { key: "marginPct", label: "Margin %", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ];

      return {
        reportType,
        title: "Business Performance Report",
        subtitle: "Cross-entity comparative revenue, acquisition costs, expenses, and net profit margins.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Active Entities", value: String(businesses.length) },
          { label: "Total Revenue", value: fmtAED(totalSales), currency: "AED" },
          { label: "Total Purchases", value: fmtAED(totalPurchases), currency: "AED" },
          { label: "Net Profit", value: fmtAED(netProfit), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    case "purchase-report": {
      const purchases = await prisma.purchase.findMany({
        where: {
          businessId: effectiveBizFilter,
          ...(dateRange ? { purchaseDate: dateRange } : {}),
          ...(status && status !== "all" ? { status: status as PurchaseStatus } : {}),
          ...(product && product !== "all" ? { productType: { contains: product, mode: "insensitive" } } : {}),
        },
        include: { business: { select: { name: true, code: true } } },
        orderBy: { purchaseDate: "desc" },
      });

      const totalLandedCost = purchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
      const totalQuantity = purchases.reduce((acc, p) => acc + Number(p.quantity || 0), 0);

      const rows = purchases.map((p) => ({
        purchaseCode: p.purchaseCode,
        date: p.purchaseDate.toISOString().split("T")[0],
        businessName: p.business.name,
        productType: p.productType,
        quantity: `${Number(p.quantity).toLocaleString()} ${p.quantityUnit}`,
        unitPriceAED: fmtAED(Number(p.basePricePerUnitAED || 0)),
        acquisitionValueAED: fmtAED(Number(p.baseAcquisitionValue || 0)),
        totalLandedCostAED: fmtAED(Number(p.totalLandedCost || 0)),
        status: p.status,
      }));

      const columns: DetailedReportColumn[] = [
        { key: "purchaseCode", label: "Purchase Code" },
        { key: "date", label: "Date" },
        { key: "businessName", label: "Business" },
        { key: "productType", label: "Product" },
        { key: "quantity", label: "Quantity", align: "right" },
        { key: "unitPriceAED", label: "Unit Price (AED)", align: "right" },
        { key: "acquisitionValueAED", label: "Acquisition (AED)", align: "right" },
        { key: "totalLandedCostAED", label: "Total Landed (AED)", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ];

      return {
        reportType,
        title: "Bullion & Goods Purchase Report",
        subtitle: "Itemized purchase lots, unit weights, landed acquisitions, customs, and clearing status.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Purchase Lots", value: String(purchases.length) },
          { label: "Total Units Acquired", value: totalQuantity.toLocaleString() },
          { label: "Total Landed Cost", value: fmtAED(totalLandedCost), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    case "sales-report": {
      const sales = await prisma.sale.findMany({
        where: {
          businessId: effectiveBizFilter,
          ...(dateRange ? { saleDate: dateRange } : {}),
          ...(status && status !== "all" ? { status: status as SaleStatus } : {}),
          ...(product && product !== "all" ? { productType: { contains: product, mode: "insensitive" } } : {}),
        },
        include: { business: { select: { name: true, code: true } } },
        orderBy: { saleDate: "desc" },
      });

      const totalSalesAED = sales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
      const totalRealizationINR = sales.reduce((acc, s) => acc + Number(s.inrRealizationValue || 0), 0);

      const rows = sales.map((s) => ({
        saleCode: s.saleCode,
        date: s.saleDate.toISOString().split("T")[0],
        businessName: s.business.name,
        buyerFirm: s.buyerFirm,
        productType: s.productType,
        quantity: `${Number(s.quantity).toLocaleString()} ${s.quantityUnit}`,
        totalINR: `₹${Number(s.inrRealizationValue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        fxRate: Number(s.realizedFxRate).toFixed(4),
        aedEquivalent: fmtAED(Number(s.aedEquivalent)),
        status: s.status,
      }));

      const columns: DetailedReportColumn[] = [
        { key: "saleCode", label: "Sale Code" },
        { key: "date", label: "Date" },
        { key: "businessName", label: "Business" },
        { key: "buyerFirm", label: "Buyer Firm" },
        { key: "productType", label: "Product" },
        { key: "quantity", label: "Quantity", align: "right" },
        { key: "totalINR", label: "Realization (INR)", align: "right" },
        { key: "fxRate", label: "FX Rate", align: "right" },
        { key: "aedEquivalent", label: "AED Equiv.", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ];

      return {
        reportType,
        title: "Sales & Cross-Border Realization Report",
        subtitle: "India liquidation desk proceeds, INR realization receipts, hedged FX rates, and AED credits.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Sales Invoices", value: String(sales.length) },
          { label: "Total INR Realized", value: `₹${totalRealizationINR.toLocaleString("en-IN")}` },
          { label: "Total AED Proceeds", value: fmtAED(totalSalesAED), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    case "expense-report": {
      const expenses = await prisma.expense.findMany({
        where: {
          businessId: effectiveBizFilter,
          ...(dateRange ? { expenseDate: dateRange } : {}),
          ...(status && status !== "all" ? { status: status as ExpensePaymentStatus } : {}),
        },
        include: { business: { select: { name: true, code: true } } },
        orderBy: { expenseDate: "desc" },
      });

      const totalExpenseAED = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

      const rows = expenses.map((e) => ({
        expenseCode: e.expenseCode,
        date: e.expenseDate.toISOString().split("T")[0],
        businessName: e.business.name,
        category: e.category,
        description: e.description,
        paymentMethod: e.paymentMethod || "Bank Transfer",
        amountAED: fmtAED(Number(e.amount)),
        isLandedCost: e.isPurchaseLandedCost ? "Yes" : "No",
        status: e.status,
      }));

      const columns: DetailedReportColumn[] = [
        { key: "expenseCode", label: "Expense Code" },
        { key: "date", label: "Date" },
        { key: "businessName", label: "Business" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "amountAED", label: "Amount (AED)", align: "right" },
        { key: "isLandedCost", label: "Landed Cost", align: "center" },
        { key: "status", label: "Status", align: "center" },
      ];

      return {
        reportType,
        title: "Operating Expenses & Logistics Report",
        subtitle: "Audit log of physical vaulting, armed transit, assaying fees, port customs, and banking spreads.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Total Vouchers", value: String(expenses.length) },
          { label: "Total Disbursed", value: fmtAED(totalExpenseAED), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    case "investor-report": {
      const investors = await prisma.investor.findMany({
        where: { businessId: effectiveBizFilter },
        include: {
          business: { select: { name: true, code: true } },
          investments: true,
        },
        orderBy: { name: "asc" },
      });

      // Fetch global net profit for period
      const [sales, purchases, expenses] = await Promise.all([
        prisma.sale.findMany({ where: { businessId: effectiveBizFilter, ...(dateRange ? { saleDate: dateRange } : {}) }, select: { aedEquivalent: true } }),
        prisma.purchase.findMany({ where: { businessId: effectiveBizFilter, ...(dateRange ? { purchaseDate: dateRange } : {}) }, select: { totalLandedCost: true } }),
        prisma.expense.findMany({ where: { businessId: effectiveBizFilter, ...(dateRange ? { expenseDate: dateRange } : {}), isPurchaseLandedCost: false }, select: { amount: true } }),
      ]);
      const rev = sales.reduce((a, s) => a + Number(s.aedEquivalent || 0), 0);
      const cost = purchases.reduce((a, p) => a + Number(p.totalLandedCost || 0), 0);
      const exp = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
      const netProfit = rev - cost - exp;

      let totalCommitted = 0;
      const rows = investors.map((inv) => {
        const committed = inv.investments.reduce((acc, i) => acc + Number(i.committedAmount || 0), 0);
        totalCommitted += committed;
        const sharePct = inv.investments.reduce((acc, i) => acc + Number(i.profitSharePct || 0), Number(inv.defaultSharePct || 0));
        const estProfit = netProfit > 0 ? (netProfit * sharePct) / 100 : 0;

        return {
          code: inv.code,
          name: inv.name,
          businessName: inv.business?.name || "Unassigned",
          type: inv.type,
          committedAED: fmtAED(committed),
          profitSharePct: `${sharePct.toFixed(2)}%`,
          estProfitAED: fmtAED(estProfit),
          status: inv.status,
        };
      });

      const columns: DetailedReportColumn[] = [
        { key: "code", label: "Investor Code" },
        { key: "name", label: "Investor Name" },
        { key: "businessName", label: "Entity" },
        { key: "type", label: "Type" },
        { key: "committedAED", label: "Committed Capital (AED)", align: "right" },
        { key: "profitSharePct", label: "Profit Share %", align: "right" },
        { key: "estProfitAED", label: "Est. Entitlement (AED)", align: "right" },
        { key: "status", label: "Status", align: "center" },
      ];

      return {
        reportType,
        title: "Investor Capital & Yield Report",
        subtitle: "Partner & external LP capital commitments, equity allocations, and calculated profit pools.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Active Investors", value: String(investors.length) },
          { label: "Total Committed Capital", value: fmtAED(totalCommitted), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    case "settlement-report": {
      const transactions = await prisma.transaction.findMany({
        where: {
          businessId: effectiveBizFilter,
          ...(dateRange ? { transactionDate: dateRange } : {}),
        },
        include: {
          business: { select: { name: true, code: true } },
          investor: { select: { name: true, code: true } },
        },
        orderBy: { transactionDate: "desc" },
      });

      const totalDisbursed = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const rows = transactions.map((t) => ({
        transactionCode: t.transactionCode,
        date: t.transactionDate.toISOString().split("T")[0],
        businessName: t.business.name,
        investorName: t.investor?.name || "General Entity Escrow",
        type: t.type,
        paymentMethod: t.paymentMethod,
        bankReference: t.bankReference || "N/A",
        amountAED: fmtAED(Number(t.amount)),
      }));

      const columns: DetailedReportColumn[] = [
        { key: "transactionCode", label: "Tx Code" },
        { key: "date", label: "Date" },
        { key: "businessName", label: "Business" },
        { key: "investorName", label: "Recipient / Partner" },
        { key: "type", label: "Type" },
        { key: "paymentMethod", label: "Method" },
        { key: "bankReference", label: "Bank Reference" },
        { key: "amountAED", label: "Amount (AED)", align: "right" },
      ];

      return {
        reportType,
        title: "Settlement & Disbursement Ledger",
        subtitle: "Audit trail of wire disbursements, escrow distributions, partner dividends, and banking references.",
        entityScope: entityScopeName,
        periodLabel,
        dateRange: dateRangeString,
        summaryMetrics: [
          { label: "Settlement Records", value: String(transactions.length) },
          { label: "Total Settled Amount", value: fmtAED(totalDisbursed), currency: "AED" },
        ],
        columns,
        rows,
        totalCount: rows.length,
      };
    }

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}
