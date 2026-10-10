import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/auth/session";
import { requireBusinessAccess, getAuthorizedBusinessIds } from "@/lib/auth/authorization";
import { Prisma, ExpenseCategory } from "@prisma/client";
import { getOrSetCache } from "@/lib/redis/cache";
import { CacheKeys, CacheTTL } from "@/lib/redis/keys";
import { ProfitLossQuery } from "@/validators/profit-loss.validator";
import {
  ProfitLossResponseData,
  BusinessProfitability,
  ProfitLossSummaryKPIs,
  ProfitLossStatementData,
  CapitalWaterfallData,
  InvestorAllocationsData,
  PartnerAllocation,
  ExpenseImpactData,
  CrossLinksData,
} from "@/types/profit-loss";
import { BalanceSheetQuery } from "@/validators/balance-sheet.validator";
import {
  BalanceSheetResponseData,
  BusinessPositionComparison,
  BalanceSheetSummaryKPIs,
  PartnerSettlementItem,
  BalanceSheetItem,
  InvestorSettlementBreakdownItem,
} from "@/types/balance-sheet";

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  DELIVERY_FREIGHT: "Delivery / Armored Transport Protocol",
  LABOUR_VAULT: "Physical Vault Secure Custody & Labour",
  PROCESSING_ASSAYING: "Processing & Assaying Certification",
  INDIA_EXPENSE: "India Realization & Port Demurrage Costs",
  TRANSFER_FX_FEES: "Transfer, Banking & FX Hedging Spreads",
  GENERAL_OVERHEAD: "General Operational Overhead",
};

function parseDateFilters(query: ProfitLossQuery): { gte?: Date; lte?: Date } | undefined {
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

    switch (query.period) {
      case "this_month": {
        const start = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "last_month": {
        const start = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "q3_2026": {
        const start = new Date(Date.UTC(2026, 6, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(2026, 8, 30, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "ytd_2026": {
        const start = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999));
        return { gte: start, lte: end };
      }
      case "all":
      default:
        return undefined;
    }
  }

  return undefined;
}

export async function getFullProfitLossData(
  session: SessionPayload,
  query: ProfitLossQuery = {}
): Promise<ProfitLossResponseData> {
  const { businessId, status, productType } = query;
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

  const dateFilter = parseDateFilters(query);

  // Construct deterministic cache key
  const baseKey = CacheKeys.financials.pnl(
    businessId && businessId !== "all" ? businessId : undefined,
    session.userId,
    session.role
  );
  const cacheKey = `${baseKey}:${JSON.stringify(query)}`;

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    // Build Prisma filters
    const saleWhere: Prisma.SaleWhereInput = {
      ...(businessFilter ? { businessId: businessFilter } : {}),
      ...(dateFilter ? { saleDate: dateFilter } : {}),
      ...(status && status !== "all"
        ? { status: status === "CLEARED" ? "CLEARED" : "PENDING" }
        : {}),
      ...(productType && productType !== "all"
        ? { productType: { contains: productType, mode: "insensitive" } }
        : {}),
    };

    const purchaseWhere: Prisma.PurchaseWhereInput = {
      ...(businessFilter ? { businessId: businessFilter } : {}),
      ...(dateFilter ? { purchaseDate: dateFilter } : {}),
      ...(status && status !== "all"
        ? { status: status === "CLEARED" ? "CLEARED" : "IN_PROGRESS" }
        : { status: { in: ["CLEARED", "IN_PROGRESS"] } }), // Exclude DRAFT by default
      ...(productType && productType !== "all"
        ? { productType: { contains: productType, mode: "insensitive" } }
        : {}),
    };

    const expenseWhere: Prisma.ExpenseWhereInput = {
      ...(businessFilter ? { businessId: businessFilter } : {}),
      ...(dateFilter ? { expenseDate: dateFilter } : {}),
      ...(status && status !== "all"
        ? { status: status === "CLEARED" ? "CLEARED" : "PENDING" }
        : {}),
      isPurchaseLandedCost: false, // Prevent double-counting landed costs
    };

    const businessWhere: Prisma.BusinessWhereInput = {
      ...(businessFilter ? { id: businessFilter } : {}),
      status: "ACTIVE",
    };

    // Parallel fetch
    const [
      sales,
      purchases,
      expenses,
      businesses,
      profitTransactions,
      allSaleProducts,
      allPurchaseProducts,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: saleWhere,
        select: {
          id: true,
          saleCode: true,
          businessId: true,
          aedEquivalent: true,
          productType: true,
          quantityGms: true,
        },
      }),
      prisma.purchase.findMany({
        where: purchaseWhere,
        select: {
          id: true,
          purchaseCode: true,
          businessId: true,
          totalLandedCost: true,
          productType: true,
          quantityGms: true,
        },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        select: {
          id: true,
          expenseCode: true,
          businessId: true,
          category: true,
          amount: true,
          description: true,
          expenseDate: true,
        },
        orderBy: { expenseDate: "asc" },
      }),
      prisma.business.findMany({
        where: businessWhere,
        select: {
          id: true,
          name: true,
          code: true,
          partnerEquityPct: true,
          createdAt: true,
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          type: "PROFIT_DISBURSAL",
        },
        select: {
          businessId: true,
          amount: true,
        },
      }),
      prisma.sale.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { productType: true },
        distinct: ["productType"],
      }),
      prisma.purchase.findMany({
        where: businessFilter ? { businessId: businessFilter } : {},
        select: { productType: true },
        distinct: ["productType"],
      }),
    ]);

    // Distinct available products
    const productSet = new Set<string>();
    for (const s of allSaleProducts) {
      if (s.productType && s.productType.trim()) productSet.add(s.productType.trim());
    }
    for (const p of allPurchaseProducts) {
      if (p.productType && p.productType.trim()) productSet.add(p.productType.trim());
    }
    const availableProducts = Array.from(productSet).sort();

    // Aggregate totals
    const totalSalesAED = sales.reduce((acc, s) => acc + Number(s.aedEquivalent || 0), 0);
    const purchaseCostAED = purchases.reduce((acc, p) => acc + Number(p.totalLandedCost || 0), 0);
    const totalExpensesAED = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const grossProfitAED = totalSalesAED - purchaseCostAED;
    const netProfitAED = grossProfitAED - totalExpensesAED;

    const grossSpreadMarginPercent =
      totalSalesAED > 0 ? Number(((grossProfitAED / totalSalesAED) * 100).toFixed(2)) : 0;
    const netMarginPercent =
      totalSalesAED > 0 ? Number(((netProfitAED / totalSalesAED) * 100).toFixed(2)) : 0;

    const kpis: ProfitLossSummaryKPIs = {
      totalSalesAED,
      purchaseCostAED,
      totalExpensesAED,
      grossProfitAED,
      netProfitAED,
    };

    // Business Profitability Breakdown
    const businessMap = new Map<
      string,
      {
        id: string;
        name: string;
        salesAED: number;
        purchaseAED: number;
        expensesAED: number;
        partnerEquityPct: number;
        partnerName: string;
        createdAt: Date;
      }
    >();

    for (const biz of businesses) {
      businessMap.set(biz.id, {
        id: biz.id,
        name: biz.name,
        salesAED: 0,
        purchaseAED: 0,
        expensesAED: 0,
        partnerEquityPct: Number(biz.partnerEquityPct || 0),
        partnerName: biz.partner?.name || "Partner",
        createdAt: biz.createdAt,
      });
    }

    for (const s of sales) {
      const b = businessMap.get(s.businessId);
      if (b) {
        b.salesAED += Number(s.aedEquivalent || 0);
      }
    }

    for (const p of purchases) {
      const b = businessMap.get(p.businessId);
      if (b) {
        b.purchaseAED += Number(p.totalLandedCost || 0);
      }
    }

    for (const e of expenses) {
      const b = businessMap.get(e.businessId);
      if (b) {
        b.expensesAED += Number(e.amount || 0);
      }
    }

    const businessProfitabilityList: BusinessProfitability[] = [];
    let totalCalculatedInvestorShareAED = 0;

    for (const b of businessMap.values()) {
      const bizGross = b.salesAED - b.purchaseAED;
      const bizNet = bizGross - b.expensesAED;
      const bizMargin = b.salesAED > 0 ? Number(((bizNet / b.salesAED) * 100).toFixed(2)) : 0;

      if (bizNet > 0 && b.partnerEquityPct > 0) {
        totalCalculatedInvestorShareAED += (bizNet * b.partnerEquityPct) / 100;
      }

      businessProfitabilityList.push({
        id: b.id,
        name: b.name,
        salesAED: b.salesAED,
        purchaseAED: b.purchaseAED,
        expensesAED: b.expensesAED,
        grossProfitAED: bizGross,
        netProfitAED: bizNet,
        netMarginPercent: bizMargin,
        createdAt: b.createdAt,
      });
    }

    // Append Consolidated row if multiple businesses or view is all
    if (businesses.length > 1 || !businessId || businessId === "all") {
      businessProfitabilityList.push({
        id: "consolidated",
        name: "CONSOLIDATED ALL",
        salesAED: totalSalesAED,
        purchaseAED: purchaseCostAED,
        expensesAED: totalExpensesAED,
        grossProfitAED,
        netProfitAED,
        netMarginPercent,
        isConsolidated: true,
      });
    }

    // Investor & Desk Splits
    const investorShareAED = Math.round(totalCalculatedInvestorShareAED * 100) / 100;
    const netDeskRetainedProfitAED =
      Math.round(Math.max(0, netProfitAED - investorShareAED) * 100) / 100;

    const investorSharePercent =
      netProfitAED > 0 ? Number(((investorShareAED / netProfitAED) * 100).toFixed(2)) : 0;
    const deskRetainedPercent =
      netProfitAED > 0 ? Number(((netDeskRetainedProfitAED / netProfitAED) * 100).toFixed(2)) : 100;

    // Operating expenses grouped by category
    const expenseCategoryMap: Record<string, number> = {
      DELIVERY_FREIGHT: 0,
      LABOUR_VAULT: 0,
      PROCESSING_ASSAYING: 0,
      INDIA_EXPENSE: 0,
      TRANSFER_FX_FEES: 0,
      GENERAL_OVERHEAD: 0,
    };

    for (const exp of expenses) {
      const cat = exp.category || "GENERAL_OVERHEAD";
      if (expenseCategoryMap[cat] !== undefined) {
        expenseCategoryMap[cat] += Number(exp.amount || 0);
      } else {
        expenseCategoryMap[cat] = Number(exp.amount || 0);
      }
    }

    const operatingExpenses = Object.keys(expenseCategoryMap)
      .map((cat) => ({
        title: (CATEGORY_NAMES as Record<string, string>)[cat] || cat.replace(/_/g, " "),
        amountAED: expenseCategoryMap[cat],
      }))
      .filter((item) => item.amountAED > 0 || expenses.length === 0);

    // If no expenses at all, provide standard categories with 0
    if (operatingExpenses.length === 0) {
      for (const cat of Object.keys(CATEGORY_NAMES) as ExpenseCategory[]) {
        operatingExpenses.push({
          title: CATEGORY_NAMES[cat],
          amountAED: 0,
        });
      }
    }

    const statement: ProfitLossStatementData = {
      tradingRevenue: [
        {
          title: "India Sales / Realization Protocol",
          amountAED: totalSalesAED,
        },
      ],
      totalRevenueAED: totalSalesAED,
      costOfBullion: [
        {
          title: "Dubai Physical Bullion Purchase (999.9 Fine Sourcing)",
          amountAED: purchaseCostAED,
        },
      ],
      totalPurchaseCostAED: purchaseCostAED,
      grossProfitAED,
      grossSpreadMarginPercent,
      operatingExpenses,
      totalExpensesAED,
      netProfitAED,
      auditedNetProfitAED: netProfitAED, // Backward compatibility alias
      netMarginPercent,
      investorShareAED,
      investorSharePercent,
      netDeskRetainedProfitAED,
      deskRetainedPercent,
    };

    // Capital Waterfall Data
    const waterfall: CapitalWaterfallData = {
      grossRealizationAED: totalSalesAED,
      sourcingCostAED: purchaseCostAED,
      grossMarginAED: grossProfitAED,
      tradeOpsCostAED: totalExpensesAED,
      netProfitAED,
      auditedNetProfitAED: netProfitAED, // Backward compatibility alias
      investorShareAED,
      investorSharePercent,
      deskRetainedAED: netDeskRetainedProfitAED,
      deskRetainedPercent,
    };

    // Investor Allocations Breakdown
    const disbursalsByBusiness = new Map<string, number>();
    for (const t of profitTransactions) {
      const cur = disbursalsByBusiness.get(t.businessId) || 0;
      disbursalsByBusiness.set(t.businessId, cur + Number(t.amount || 0));
    }

    const partnerAllocations: PartnerAllocation[] = [];
    for (const b of businessMap.values()) {
      const bizGross = b.salesAED - b.purchaseAED;
      const bizNet = bizGross - b.expensesAED;
      const allocated = bizNet > 0 ? (bizNet * b.partnerEquityPct) / 100 : 0;
      const paid = disbursalsByBusiness.get(b.id) || 0;
      const pending = Math.max(0, allocated - paid);

      partnerAllocations.push({
        id: b.id,
        partnerName: b.partnerName,
        businessName: b.name,
        allocatedProfitAED: Math.round(allocated * 100) / 100,
        paidAED: Math.round(paid * 100) / 100,
        pendingAED: Math.round(pending * 100) / 100,
      });
    }

    const allocations: InvestorAllocationsData = {
      totalNetProfitAED: netProfitAED,
      investorShareAED,
      investorSharePercent,
      deskShareAED: netDeskRetainedProfitAED,
      deskSharePercent: deskRetainedPercent,
      partners: partnerAllocations,
    };

    // Expense Impact Calculation
    const expenseToSalesRatio =
      totalSalesAED > 0 ? Number(((totalExpensesAED / totalSalesAED) * 100).toFixed(2)) : 0;
    const expenseToGrossProfitRatio =
      grossProfitAED > 0 ? Number(((totalExpensesAED / grossProfitAED) * 100).toFixed(2)) : 0;

    let topCategory = "INDIA_EXPENSE";
    let topCategoryAmount = 0;
    for (const [cat, amt] of Object.entries(expenseCategoryMap)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    }

    const topCostCenterPercent =
      totalExpensesAED > 0
        ? Number(((topCategoryAmount / totalExpensesAED) * 100).toFixed(1))
        : 0;

    const expenseImpact: ExpenseImpactData = {
      expenseToSalesRatio,
      expenseToGrossProfitRatio,
      topCostCenterTitle: (CATEGORY_NAMES as Record<string, string>)[topCategory] || topCategory.replace(/_/g, " "),
      topCostCenterAmountAED: topCategoryAmount,
      topCostCenterPercent,
    };

    // Cross Links
    let expenseCodeRange = "None";
    if (expenses.length > 0) {
      const firstCode = expenses[0].expenseCode;
      const lastCode = expenses[expenses.length - 1].expenseCode;
      expenseCodeRange =
        firstCode === lastCode ? firstCode : `${firstCode} - ${lastCode}`;
    }

    const crossLinks: CrossLinksData = {
      expenseCount: expenses.length,
      expenseCodeRange,
      investorCount: businesses.length,
    };

    return {
      kpis,
      businesses: businessProfitabilityList,
      statement,
      waterfall,
      allocations,
      expenseImpact,
      crossLinks,
      availableProducts,
    };
  });
}

export async function getProfitLossSummary(session: SessionPayload, businessId?: string) {
  const fullData = await getFullProfitLossData(session, {
    businessId: businessId || undefined,
  });

  return {
    totalRevenueAed: fullData.kpis.totalSalesAED,
    totalAcquisitionCostAed: fullData.kpis.purchaseCostAED,
    grossArbitrageSpreadAed: fullData.kpis.grossProfitAED,
    totalExpensesAed: fullData.kpis.totalExpensesAED,
    netProfitAed: fullData.kpis.netProfitAED,
    marginPercentage: fullData.statement.netMarginPercent,
  };
}

export async function getFullBalanceSheetData(
  session: SessionPayload,
  query: BalanceSheetQuery = {}
): Promise<BalanceSheetResponseData> {
  const { businessId, asOfDate, status, productType } = query;
  let businessFilter: Prisma.StringFilter | undefined;
  let businessScopeName = "Consolidated Portfolio";

  if (businessId && businessId !== "all") {
    await requireBusinessAccess(businessId, session);
    businessFilter = { equals: businessId };
  } else {
    const authorized = await getAuthorizedBusinessIds(session);
    if (authorized !== "ALL") {
      businessFilter = { in: authorized };
    }
  }

  // Parse asOfDate (default to today if missing)
  let asOfDateUtc: Date;
  let asOfDateStr = asOfDate;
  if (asOfDate) {
    const parts = asOfDate.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      asOfDateUtc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));
    } else {
      const d = new Date(asOfDate);
      asOfDateUtc = isNaN(d.getTime()) ? new Date() : d;
    }
  } else {
    asOfDateUtc = new Date();
    asOfDateStr = asOfDateUtc.toISOString().split("T")[0];
  }

  const cacheKey = CacheKeys.financials.balanceSheet(
    businessId,
    session.userId,
    session.role,
    asOfDateStr,
    status,
    productType
  );

  return getOrSetCache(cacheKey, CacheTTL.SHORT, async () => {
    // 1. Status filters
    let saleStatusFilter: Prisma.EnumSaleStatusFilter | undefined;
    if (status && status !== "all") {
      saleStatusFilter = { equals: status as "CLEARED" | "PENDING" };
    } else {
      saleStatusFilter = { in: ["CLEARED", "PENDING"] };
    }

    let purchaseStatusFilter: Prisma.EnumPurchaseStatusFilter | undefined;
    if (status && status !== "all") {
      if (status === "CLEARED") {
        purchaseStatusFilter = { equals: "CLEARED" };
      } else if (status === "PENDING") {
        purchaseStatusFilter = { equals: "IN_PROGRESS" };
      }
    } else {
      purchaseStatusFilter = { in: ["CLEARED", "IN_PROGRESS"] };
    }

    // 2. Product type filters
    const productFilter =
      productType && productType !== "all" ? { equals: productType } : undefined;

    // Fetch data in parallel
    const [
      businesses,
      inventories,
      sales,
      purchases,
      expenses,
      disbursals,
      allInvestments,
      allSettlementTransactions,
    ] = await Promise.all([
      prisma.business.findMany({
        where: businessFilter ? { id: businessFilter } : {},
        include: {
          investments: {
            where: {
              createdAt: { lte: asOfDateUtc },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.inventory.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          ...(productFilter ? { productType: productFilter } : {}),
        },
        include: {
          business: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.sale.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          saleDate: { lte: asOfDateUtc },
          ...(saleStatusFilter ? { status: saleStatusFilter } : {}),
          ...(productFilter ? { productType: productFilter } : {}),
        },
        include: {
          business: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.purchase.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          purchaseDate: { lte: asOfDateUtc },
          ...(purchaseStatusFilter ? { status: purchaseStatusFilter } : {}),
          ...(productFilter ? { productType: productFilter } : {}),
        },
        include: {
          business: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.expense.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          expenseDate: { lte: asOfDateUtc },
          isPurchaseLandedCost: false,
        },
        include: {
          business: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.transaction.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          type: "PROFIT_DISBURSAL",
          createdAt: { lte: asOfDateUtc },
        },
        include: {
          business: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.investment.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          createdAt: { lte: asOfDateUtc },
          status: { in: ["ACTIVE", "SETTLED"] },
        },
        include: {
          investor: true,
          business: { select: { id: true, name: true, code: true } },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
      }),
      prisma.transaction.findMany({
        where: {
          ...(businessFilter ? { businessId: businessFilter } : {}),
          type: { in: ["CAPITAL_RETURN", "PROFIT_DISBURSAL"] },
          transactionDate: { lte: asOfDateUtc },
        },
        select: {
          businessId: true,
          investorId: true,
          amount: true,
          type: true,
        },
      }),
    ]);

    if (businessId && businessId !== "all" && businesses.length > 0) {
      businessScopeName = businesses[0].name;
    }

    // Capital Position
    let totalCommittedCapitalAED = 0;
    let adminCapitalAED = 0;
    let partnerCapitalAED = 0;

    for (const b of businesses) {
      const bTotal = Number(b.totalInvestmentAED || 0);
      const bAdmin = Number(b.adminInvestmentAED || 0);
      const bPartner = Number(b.partnerInvestmentAED || 0);
      totalCommittedCapitalAED += bTotal;
      adminCapitalAED += bAdmin;
      partnerCapitalAED += bPartner;
    }

    const adminSharePercent =
      totalCommittedCapitalAED > 0
        ? (adminCapitalAED / totalCommittedCapitalAED) * 100
        : 0;
    const partnerSharePercent =
      totalCommittedCapitalAED > 0
        ? (partnerCapitalAED / totalCommittedCapitalAED) * 100
        : 0;

    const capitalBreakdown = [
      {
        name: "Admin Core Equity / Capital Sourcing",
        amountAED: adminCapitalAED,
        drilldown: `${adminSharePercent.toFixed(1)}% of pool`,
        note: "Core institutional & founder capital contribution",
      },
      {
        name: "Partner Committed Capital (Active Ventures)",
        amountAED: partnerCapitalAED,
        drilldown: `${partnerSharePercent.toFixed(1)}% of pool`,
        note: "Committed trading capital from equity partners",
      },
      {
        name: "Total Committed Entity Capital Pool",
        amountAED: totalCommittedCapitalAED,
        drilldown: "100.0%",
        note: "Base operating capital across verified businesses",
        isHighlighted: true,
      },
    ];

    // Inventory Position
    let totalStockGrams = 0;
    let totalCarryingValueAED = 0;
    const inventoryItems = inventories.map((inv) => {
      const qty = Number(inv.remainingQuantity || 0);
      const val = Number(inv.carryingValueAED || 0);
      const avgCost = Number(inv.averageCostPerUnitAED || 0);
      totalStockGrams += qty;
      totalCarryingValueAED += val;
      return {
        businessId: inv.businessId,
        businessName: inv.business.name,
        productType: inv.productType,
        remainingQuantity: qty,
        carryingValueAED: val,
        averageCostPerUnitAED: avgCost,
      };
    });

    const averageCostPerGramAED =
      totalStockGrams > 0 ? totalCarryingValueAED / totalStockGrams : 0;

    const inventoryBreakdown: BalanceSheetItem[] = inventoryItems.map((item) => ({
      name: `${item.businessName} — ${item.productType.replace(/_/g, " ")}`,
      amountAED: item.carryingValueAED,
      drilldown: `${item.remainingQuantity.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} gms @ AED ${item.averageCostPerUnitAED.toFixed(2)}/g`,
      badge: "In Vault",
    }));

    inventoryBreakdown.push({
      name: "Consolidated Physical Inventory Valuation",
      amountAED: totalCarryingValueAED,
      drilldown: `${totalStockGrams.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} gms physical gold in vault`,
      note:
        "Weighted avg carrying cost: AED " +
        averageCostPerGramAED.toFixed(2) +
        " / gram",
      isHighlighted: true,
    });

    // Trading Position
    let realizedSalesAED = 0;
    for (const s of sales) {
      realizedSalesAED += Number(s.aedEquivalent || 0);
    }

    let purchaseSourcingCostAED = 0;
    for (const p of purchases) {
      purchaseSourcingCostAED += Number(p.totalLandedCost || 0);
    }

    let operatingExpensesAED = 0;
    for (const e of expenses) {
      operatingExpensesAED += Number(e.amount || 0);
    }

    const operatingProfitAED =
      realizedSalesAED - (purchaseSourcingCostAED + operatingExpensesAED);
    const operatingMarginPercent =
      realizedSalesAED > 0
        ? (operatingProfitAED / realizedSalesAED) * 100
        : 0;

    const tradingBreakdown = [
      {
        name: "Realized Sales Revenue (AED Equivalent)",
        amountAED: realizedSalesAED,
        drilldown: `${sales.length} transactions cleared/pending`,
        note: "Total gross sales consideration realized",
      },
      {
        name: "Cumulative Bullion Sourcing Costs (Landed)",
        amountAED: -purchaseSourcingCostAED,
        drilldown: `${purchases.length} purchases landed`,
        note: "Raw metal purchase plus direct clearance expenses",
      },
      {
        name: "Operating Overheads & Logistics",
        amountAED: -operatingExpensesAED,
        drilldown: `${expenses.length} operational expense records`,
        note: "Vaulting, freight, assaying, and operational fees",
      },
      {
        name: "Cumulative Operating Position / Net Spread",
        amountAED: operatingProfitAED,
        drilldown: `${operatingMarginPercent.toFixed(2)}% margin`,
        note: "Net operational arbitrage spread before partner disbursal",
        isHighlighted: true,
      },
    ];

    // Partner Settlement Position
    const partnerSettlementItems: PartnerSettlementItem[] = [];
    let totalPartnerEntitlementAED = 0;
    let profitDisbursedAED = 0;

    for (const d of disbursals) {
      profitDisbursedAED += Number(d.amount || 0);
    }

    for (const b of businesses) {
      const bSales = sales
        .filter((s) => s.businessId === b.id)
        .reduce((sum, s) => sum + Number(s.aedEquivalent || 0), 0);
      const bPurchases = purchases
        .filter((p) => p.businessId === b.id)
        .reduce((sum, p) => sum + Number(p.totalLandedCost || 0), 0);
      const bExpenses = expenses
        .filter((e) => e.businessId === b.id)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const bDisbursed = disbursals
        .filter((d) => d.businessId === b.id)
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      const bOpProfit = bSales - (bPurchases + bExpenses);
      const equityPct = Number(b.partnerEquityPct || 0);
      const entitlement = bOpProfit > 0 ? (bOpProfit * equityPct) / 100 : 0;
      const pending = Math.max(0, entitlement - bDisbursed);

      totalPartnerEntitlementAED += entitlement;

      partnerSettlementItems.push({
        id: b.id,
        partnerName: `Partner (${equityPct}%)`,
        businessName: b.name,
        entitlementAED: entitlement,
        disbursedAED: bDisbursed,
        pendingAED: pending,
      });
    }

    const pendingPartnerDisbursalAED = Math.max(
      0,
      totalPartnerEntitlementAED - profitDisbursedAED
    );

    const settlementBreakdown = [
      {
        name: "Cumulative Partner Profit Entitlements",
        amountAED: totalPartnerEntitlementAED,
        drilldown: "Based on entity equity share split",
        note: "Accrued partner share of positive operating spread",
      },
      {
        name: "Disbursed Partner Profits (Cash Outward)",
        amountAED: profitDisbursedAED,
        drilldown: `${disbursals.length} disbursal records executed`,
        note: "Actual profit distributions wired to partners",
      },
      {
        name: "Net Pending Partner Disbursals",
        amountAED: pendingPartnerDisbursalAED,
        drilldown: "Unsettled accrual payable",
        note: "Remaining partner profit payable balance",
        isHighlighted: true,
      },
    ];

    // Business Position Comparison Table
    const businessComparisonList: BusinessPositionComparison[] = businesses.map(
      (b) => {
        const bInventories = inventories.filter((i) => i.businessId === b.id);
        const bStockGrams = bInventories.reduce(
          (sum, i) => sum + Number(i.remainingQuantity || 0),
          0
        );
        const bInvValue = bInventories.reduce(
          (sum, i) => sum + Number(i.carryingValueAED || 0),
          0
        );

        const bSales = sales
          .filter((s) => s.businessId === b.id)
          .reduce((sum, s) => sum + Number(s.aedEquivalent || 0), 0);
        const bPurchases = purchases
          .filter((p) => p.businessId === b.id)
          .reduce((sum, p) => sum + Number(p.totalLandedCost || 0), 0);
        const bExpenses = expenses
          .filter((e) => e.businessId === b.id)
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const bDisbursed = disbursals
          .filter((d) => d.businessId === b.id)
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);

        const bOpProfit = bSales - (bPurchases + bExpenses);
        const equityPct = Number(b.partnerEquityPct || 0);
        const entitlement = bOpProfit > 0 ? (bOpProfit * equityPct) / 100 : 0;
        const pending = Math.max(0, entitlement - bDisbursed);

        return {
          id: b.id,
          business: b.name,
          code: b.code,
          committedCapitalAED: Number(b.totalInvestmentAED || 0),
          inventoryValueAED: bInvValue,
          stockGrams: bStockGrams,
          salesAED: bSales,
          purchaseAED: bPurchases,
          expensesAED: bExpenses,
          operatingProfitAED: bOpProfit,
          pendingDisbursalAED: pending,
        };
      }
    );

    // Consolidated row
    if (businesses.length > 1 && (!businessId || businessId === "all")) {
      businessComparisonList.push({
        id: "consolidated-row",
        business: "Consolidated Portfolio Total",
        code: "ALL",
        committedCapitalAED: totalCommittedCapitalAED,
        inventoryValueAED: totalCarryingValueAED,
        stockGrams: totalStockGrams,
        salesAED: realizedSalesAED,
        purchaseAED: purchaseSourcingCostAED,
        expensesAED: operatingExpensesAED,
        operatingProfitAED: operatingProfitAED,
        pendingDisbursalAED: pendingPartnerDisbursalAED,
        isConsolidated: true,
      });
    }

    // Investor Settlement Breakdown Calculation
    const investorSettlementBreakdown: InvestorSettlementBreakdownItem[] = [];

    // Pre-calculate net profit per business
    const bizNetProfitMap = new Map<string, number>();
    for (const b of businesses) {
      const bSales = sales
        .filter((s) => s.businessId === b.id)
        .reduce((sum, s) => sum + Number(s.aedEquivalent || 0), 0);
      const bPurchases = purchases
        .filter((p) => p.businessId === b.id)
        .reduce((sum, p) => sum + Number(p.totalLandedCost || 0), 0);
      const bExpenses = expenses
        .filter((e) => e.businessId === b.id)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const bNet = Math.max(0, bSales - (bPurchases + bExpenses));
      bizNetProfitMap.set(b.id, bNet);
    }

    for (const inv of allInvestments) {
      const bNet = bizNetProfitMap.get(inv.businessId) || 0;
      const totalInvestment = Number(inv.committedAmount || 0);

      let profitAmount = 0;
      if (inv.allocatedProfitAmount !== null && inv.allocatedProfitAmount !== undefined) {
        profitAmount = Number(inv.allocatedProfitAmount);
      } else {
        const sharePct = Number(inv.profitSharePct || 0);
        profitAmount = bNet > 0 && sharePct > 0 ? Number(((bNet * sharePct) / 100).toFixed(2)) : 0;
      }

      const totalDue = Number((totalInvestment + profitAmount).toFixed(2));

      const invTx = allSettlementTransactions.filter(
        (t) => t.businessId === inv.businessId && t.investorId === inv.investorId
      );

      let capitalPaid = 0;
      let profitPaid = 0;
      for (const t of invTx) {
        if (t.type === "CAPITAL_RETURN") {
          capitalPaid += Number(t.amount || 0);
        } else if (t.type === "PROFIT_DISBURSAL") {
          profitPaid += Number(t.amount || 0);
        }
      }
      capitalPaid = Number(capitalPaid.toFixed(2));
      profitPaid = Number(profitPaid.toFixed(2));
      const totalPaid = Number((capitalPaid + profitPaid).toFixed(2));
      const pending = Math.max(0, Number((totalDue - totalPaid).toFixed(2)));

      let status: "Pending" | "Partially Settled" | "Settled" = "Pending";
      if (totalPaid > 0.005) {
        status = pending <= 0.005 ? "Settled" : "Partially Settled";
      }

      investorSettlementBreakdown.push({
        id: inv.id,
        businessId: inv.businessId,
        businessName: inv.business.name,
        businessCode: inv.business.code,
        investorId: inv.investor.id,
        investorName: inv.investor.name,
        investorCode: inv.investor.code,
        investorType: inv.investor.type,
        totalInvestmentAED: totalInvestment,
        profitAmountAED: profitAmount,
        totalDueAED: totalDue,
        capitalPaidAED: capitalPaid,
        profitPaidAED: profitPaid,
        totalPaidAED: totalPaid,
        pendingOutstandingAED: pending,
        status,
        createdAt: inv.createdAt,
      });
    }

    // KPIs
    const kpis: BalanceSheetSummaryKPIs = {
      totalCommittedCapitalAED,
      inventoryCarryingValueAED: totalCarryingValueAED,
      totalRealizedSalesAED: realizedSalesAED,
      netOperatingProfitAED: operatingProfitAED,
      pendingPartnerDisbursalAED,
    };

    return {
      success: true,
      asOfDate: asOfDateStr || new Date().toISOString().split("T")[0],
      businessScope: businessScopeName,
      kpis,
      capital: {
        totalCommittedCapitalAED,
        adminCapitalAED,
        adminSharePercent,
        partnerCapitalAED,
        partnerSharePercent,
        breakdown: capitalBreakdown,
      },
      inventory: {
        totalStockGrams,
        totalCarryingValueAED,
        averageCostPerGramAED,
        items: inventoryItems,
        breakdown: inventoryBreakdown,
      },
      trading: {
        realizedSalesAED,
        purchaseSourcingCostAED,
        operatingExpensesAED,
        operatingProfitAED,
        operatingMarginPercent,
        breakdown: tradingBreakdown,
      },
      settlement: {
        totalPartnerEntitlementAED,
        profitDisbursedAED,
        pendingPartnerDisbursalAED,
        partners: partnerSettlementItems,
        breakdown: settlementBreakdown,
      },
      businesses: businessComparisonList,
      settlementBreakdown: investorSettlementBreakdown,
    };
  });
}

export async function getBalanceSheetSummary(
  session: SessionPayload,
  businessId?: string
) {
  const fullData = await getFullBalanceSheetData(session, {
    businessId: businessId || undefined,
  });

  return {
    totalCommittedCapital: fullData.kpis.totalCommittedCapitalAED,
    totalInwardCapital: fullData.capital.adminCapitalAED,
    totalProfitDisbursed: fullData.settlement.profitDisbursedAED,
    activeEntitiesCount: fullData.businesses.filter((b) => !b.isConsolidated).length,
    businesses: fullData.businesses,
  };
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
