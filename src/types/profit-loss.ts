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

export interface TradingCycleProfitability {
  cycleRef: string;
  entity: string;
  purchaseAED: number;
  realizationAED: number;
  expensesAED: number;
  grossAED: number;
  netAED: number;
  status: string;
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
  auditedNetProfitAED: number;
  netMarginPercent: number;
  investorShareAED: number;
  investorSharePercent: number;
  netDeskRetainedProfitAED: number;
  deskRetainedPercent: number;
}
