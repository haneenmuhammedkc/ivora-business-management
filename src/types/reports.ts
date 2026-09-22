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
  id: string;
  label: string;
}
