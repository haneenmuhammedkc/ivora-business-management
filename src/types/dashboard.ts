export type DashboardRange = "7d" | "30d" | "3m" | "1y";

export interface DashboardQuery {
  businessId?: string;
  range?: DashboardRange;
}

export interface DashboardScope {
  selectedBusinessId: string;
  businessName: string;
  role: "ADMIN" | "PARTNER";
  asOfDate: string;
}

export interface DashboardKPIs {
  totalInvestmentAED: number;
  purchaseCostAED: number;
  totalExpensesAED: number;
  totalSalesAED: number;
  netProfitAED: number;
  netMarginPercent: number;
  profitAllocatedAED: number;
}

export interface BusinessPerformanceRecord {
  id: string;
  name: string;
  code: string;
  businessType: string;
  partitionSubtitle: string;
  investmentAED: number;
  purchaseAED: number;
  salesAED: number;
  expensesAED: number;
  netProfitAED: number;
  status: "ACTIVE" | "PENDING" | "COMPLETED";
}

export interface DashboardChartPoint {
  date: string;
  sales: number;
  purchase: number;
  profit: number;
  hasMarker?: boolean;
}

export interface TradingPerformanceData {
  range: DashboardRange;
  points: DashboardChartPoint[];
}

export interface InvestorOverviewData {
  totalInvestorsCount: number;
  totalInvestedAED: number;
  profitAllocatedAED: number;
  pendingSettlementAED: number;
}

export interface DashboardBusinessOption {
  id: string;
  name: string;
  code: string;
}

export interface DashboardResponseData {
  success: boolean;
  scope: DashboardScope;
  businesses: DashboardBusinessOption[];
  kpis: DashboardKPIs;
  businessPerformance: BusinessPerformanceRecord[];
  tradingPerformance: TradingPerformanceData;
  investorOverview: InvestorOverviewData;
}
