export type ReportIconType =
  | "chart"
  | "purchase"
  | "sales"
  | "trading"
  | "expense"
  | "investor"
  | "profit-loss"
  | "balance-sheet"
  | "settlement";

export interface ReportCardItem {
  id: string;
  reportKey?: string;
  title: string;
  description: string;
  iconType: ReportIconType;
  badge: string;
  badgeVariant?: "solid" | "outline";
  footerLeft: string;
  routeHref: string;
  category: string;
}

export interface ReportsSummaryKPIs {
  totalSalesAED: number;
  totalPurchaseAED: number;
  totalExpensesAED: number;
  netProfitAED: number;
  investorShareAED: number;
}

export interface QuickDeskTabItem {
  id: "today" | "monthly" | "business" | "investor" | "expense";
  label: string;
}

export interface QuickDeskTodayData {
  purchaseCount: number;
  saleCount: number;
  expenseCount: number;
  totalSalesAED: number;
  totalPurchasesAED: number;
  totalExpensesAED: number;
  netCashAED: number;
  recentActivity: Array<{
    id: string;
    type: "SALE" | "PURCHASE" | "EXPENSE";
    code: string;
    description: string;
    amountAED: number;
    businessName: string;
    timestamp: string;
  }>;
}

export interface QuickDeskMonthlyData {
  currentMonthLabel: string;
  totalSalesAED: number;
  totalPurchasesAED: number;
  totalExpensesAED: number;
  netProfitAED: number;
  profitMarginPct: number;
  previousMonthSalesAED: number;
  salesGrowthPct: number;
}

export interface QuickDeskBusinessRow {
  id: string;
  name: string;
  code: string;
  totalSalesAED: number;
  totalPurchasesAED: number;
  totalExpensesAED: number;
  netProfitAED: number;
  marginPct: number;
  status: string;
}

export interface QuickDeskInvestorRow {
  id: string;
  name: string;
  code: string;
  type: string;
  businessName: string;
  committedCapitalAED: number;
  profitSharePct: number;
  estimatedProfitAED: number;
  status: string;
}

export interface QuickDeskExpenseRow {
  category: string;
  totalAmountAED: number;
  count: number;
  percentageOfTotal: number;
}

export interface QuickDeskPayload {
  today: QuickDeskTodayData;
  monthly: QuickDeskMonthlyData;
  business: QuickDeskBusinessRow[];
  investor: QuickDeskInvestorRow[];
  expense: QuickDeskExpenseRow[];
}

export interface BusinessOption {
  id: string;
  name: string;
  code: string;
}

export interface ReportsOverviewResponse {
  kpis: ReportsSummaryKPIs;
  quickDesk: QuickDeskPayload;
  reportCards: ReportCardItem[];
  businesses: BusinessOption[];
  productTypes: string[];
  filterEcho: {
    businessId: string;
    status: string;
    product: string;
    period: string;
    startDate?: string;
    endDate?: string;
  };
}

export type DetailedReportType =
  | "business-performance"
  | "purchase-report"
  | "sales-report"
  | "expense-report"
  | "investor-report"
  | "profit-loss"
  | "balance-sheet"
  | "settlement-report";

export interface DetailedReportColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
}

export interface DetailedReportResponse {
  reportType: DetailedReportType;
  title: string;
  subtitle: string;
  entityScope: string;
  periodLabel: string;
  dateRange: string;
  summaryMetrics: Array<{
    label: string;
    value: string;
    currency?: string;
  }>;
  columns: DetailedReportColumn[];
  rows: Record<string, string | number | null>[];
  totalCount: number;
}
