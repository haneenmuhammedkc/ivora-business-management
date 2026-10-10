/**
 * Centralized Cache Key Builders
 * Deterministic and Multi-Tenant / Authorization-Safe.
 */

const PREFIX = process.env.REDIS_KEY_PREFIX || "ivora";

export const CacheKeys = {
  businesses: {
    list: (role: string, userId: string) =>
      role === "ADMIN" ? `${PREFIX}:admin:businesses:list` : `${PREFIX}:partner:${userId}:businesses:list`,
    detail: (businessId: string) => `${PREFIX}:biz:${businessId}:detail`,
  },
  investors: {
    overview: (role: string, userId: string) =>
      role === "ADMIN" ? `${PREFIX}:admin:investors:overview` : `${PREFIX}:partner:${userId}:investors:overview`,
    business: (businessId: string) => `${PREFIX}:biz:${businessId}:investors:detail`,
    detail: (investorId: string) => `${PREFIX}:investor:${investorId}:detail`,
  },
  purchases: {
    list: (businessId?: string, role = "ADMIN", userId = "") =>
      businessId
        ? `${PREFIX}:biz:${businessId}:purchases:list`
        : role === "ADMIN"
        ? `${PREFIX}:admin:purchases:list`
        : `${PREFIX}:partner:${userId}:purchases:list`,
    detail: (purchaseId: string) => `${PREFIX}:purchase:${purchaseId}:detail`,
  },
  sales: {
    list: (businessId?: string, role = "ADMIN", userId = "") =>
      businessId
        ? `${PREFIX}:biz:${businessId}:sales:list`
        : role === "ADMIN"
        ? `${PREFIX}:admin:sales:list`
        : `${PREFIX}:partner:${userId}:sales:list`,
    detail: (saleId: string) => `${PREFIX}:sale:${saleId}:detail`,
  },
  expenses: {
    list: (businessId?: string, role = "ADMIN", userId = "") =>
      businessId
        ? `${PREFIX}:biz:${businessId}:expenses:list`
        : role === "ADMIN"
        ? `${PREFIX}:admin:expenses:list`
        : `${PREFIX}:partner:${userId}:expenses:list`,
    detail: (expenseId: string) => `${PREFIX}:expense:${expenseId}:detail`,
  },
  financials: {
    pnl: (businessId?: string, userId?: string, role?: string) => {
      if (businessId) return `${PREFIX}:biz:${businessId}:pnl`;
      return role === "ADMIN" ? `${PREFIX}:admin:pnl:summary` : `${PREFIX}:partner:${userId}:pnl:summary`;
    },
    balanceSheet: (businessId?: string, userId?: string, role?: string, asOfDate?: string, status?: string, productType?: string) => {
      const scope = businessId ? `biz:${businessId}` : role === "ADMIN" ? "admin:all" : `partner:${userId}`;
      return `${PREFIX}:${scope}:balance-sheet:${asOfDate || "latest"}:${status || "all"}:${productType || "all"}`;
    },
    reports: (businessId?: string, userId?: string, role?: string) => {
      if (businessId) return `${PREFIX}:biz:${businessId}:reports`;
      return role === "ADMIN" ? `${PREFIX}:admin:reports:summary` : `${PREFIX}:partner:${userId}:reports:summary`;
    },
  },
  dashboard: {
    kpis: (role: string, userId: string) =>
      role === "ADMIN" ? `${PREFIX}:admin:dashboard:kpis` : `${PREFIX}:partner:${userId}:dashboard:kpis`,
    data: (role: string, userId: string, businessId = "all", range = "30d") => {
      const scope = role === "ADMIN" ? "admin" : `partner:${userId}`;
      return `${PREFIX}:${scope}:dashboard:${businessId || "all"}:${range || "30d"}`;
    },
  },
  reports: {
    overview: (scope: string, queryHash: string) => `${PREFIX}:reports:overview:${scope}:${queryHash}`,
    detail: (reportType: string, scope: string, queryHash: string) => `${PREFIX}:reports:detail:${reportType}:${scope}:${queryHash}`,
  },
};

export const CacheTTL = {
  SHORT: 300,        // 5 minutes (P&L, Balance Sheet, Dashboard)
  MEDIUM: 600,       // 10 minutes (Purchases, Sales, Expenses, Cycles, Reports)
  LONG: 900,         // 15 minutes (Businesses list, Business detail, Investors)
  ONE_DAY: 86400,    // 24 hours
};
