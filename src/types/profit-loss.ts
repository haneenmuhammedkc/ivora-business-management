export interface BusinessProfitability {
  id: string;
  name: string;
  salesAED: number;
  purchaseAED: number;
  expensesAED: number;
  grossProfitAED: number;
  netProfitAED: number;
  netMarginPercent: number;
  isConsolidated?: boolean;
}

export interface ProfitLossSummaryKPIs {
  totalSalesAED: number;
  purchaseCostAED: number;
  totalExpensesAED: number;
  grossProfitAED: number;
  netProfitAED: number;
}

export interface ProfitLossStatementData {
  tradingRevenue: { title: string; amountAED: number }[];
  totalRevenueAED: number;
  costOfBullion: { title: string; amountAED: number }[];
  totalPurchaseCostAED: number;
  grossProfitAED: number;
  grossSpreadMarginPercent: number;
  operatingExpenses: { title: string; amountAED: number }[];
  totalExpensesAED: number;
  netProfitAED: number;
  auditedNetProfitAED?: number; // Kept for backward compatibility
  netMarginPercent: number;
  investorShareAED: number;
  investorSharePercent: number;
  netDeskRetainedProfitAED: number;
  deskRetainedPercent: number;
}

export interface CapitalWaterfallData {
  grossRealizationAED: number;
  sourcingCostAED: number;
  grossMarginAED: number;
  tradeOpsCostAED: number;
  netProfitAED: number;
  auditedNetProfitAED?: number; // Kept for backward compatibility
  investorShareAED: number;
  investorSharePercent: number;
  deskRetainedAED: number;
  deskRetainedPercent: number;
}

export interface PartnerAllocation {
  id: string;
  partnerName: string;
  businessName: string;
  allocatedProfitAED: number;
  paidAED: number;
  pendingAED: number;
}

export interface InvestorAllocationsData {
  totalNetProfitAED: number;
  investorShareAED: number;
  investorSharePercent: number;
  deskShareAED: number;
  deskSharePercent: number;
  partners: PartnerAllocation[];
}

export interface ExpenseImpactData {
  expenseToSalesRatio: number;
  expenseToGrossProfitRatio: number;
  topCostCenterTitle: string;
  topCostCenterAmountAED: number;
  topCostCenterPercent: number;
}

export interface CrossLinksData {
  expenseCount: number;
  expenseCodeRange: string;
  investorCount: number;
}

export type AuditedCrossLinksData = CrossLinksData; // Alias for backward compatibility

export interface ProfitLossResponseData {
  kpis: ProfitLossSummaryKPIs;
  businesses: BusinessProfitability[];
  statement: ProfitLossStatementData;
  waterfall: CapitalWaterfallData;
  allocations: InvestorAllocationsData;
  expenseImpact: ExpenseImpactData;
  crossLinks: CrossLinksData;
  availableProducts?: string[];
}
