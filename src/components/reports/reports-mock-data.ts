import {
  ReportCardItem,
  ReportsSummaryKPIs,
  QuickDeskTabItem,
} from "@/types/reports";

export const mockReportsKPIs: ReportsSummaryKPIs = {
  totalSalesAED: 120000,
  totalPurchaseAED: 245000,
  totalExpensesAED: 245000,
  netProfitAED: 245000,
  investorShareAED: 245000,
};

export const mockQuickDeskTabs: QuickDeskTabItem[] = [
  { id: "today", label: "Today's Activity" },
  { id: "monthly", label: "Monthly Performance" },
  { id: "business", label: "Business Comparison" },
  { id: "investor", label: "Investor Summary" },
  { id: "expense", label: "Expense Analysis" },
  { id: "trading", label: "Trading Cycle Summary" },
];

export const mockReportCards: ReportCardItem[] = [
  {
    id: "rep-01",
    title: "Business Performance",
    description:
      "Compare sales, purchases, expenses and profitability across businesses.",
    iconType: "chart",
    badge: "MULTI-ENTITY",
    badgeVariant: "outline",
    footerLeft: "Updated: 1h ago",
    routeHref: "/businesses",
    category: "Business",
  },
  {
    id: "rep-02",
    title: "Purchase Report",
    description:
      "Analyze Dubai bullion purchases, weights in GMS, supplier terms.",
    iconType: "purchase",
    badge: "BULLION DESK",
    badgeVariant: "outline",
    footerLeft: "6,400 GMS Total",
    routeHref: "/purchase",
    category: "Purchase",
  },
  {
    id: "rep-03",
    title: "Sales Report",
    description:
      "Analyze India sales, INR realization, and hedged FX settlement.",
    iconType: "sales",
    badge: "CROSS-BORDER",
    badgeVariant: "outline",
    footerLeft: "₹5.36M Realized",
    routeHref: "/sales",
    category: "Sales",
  },
  {
    id: "rep-04",
    title: "Trading Cycle Report",
    description:
      "Review complete trading cycles TR-0248 to TR-0246 from purchase to final realization.",
    iconType: "trading",
    badge: "REAL-TIME",
    badgeVariant: "solid",
    footerLeft: "3 Cycles Active",
    routeHref: "/trading-cycle",
    category: "Trading Cycle",
  },
  {
    id: "rep-05",
    title: "Expense Report",
    description:
      "Analyze logistics, freight, vault labour, customs, and bank FX charges.",
    iconType: "expense",
    badge: "ITEMIZED",
    badgeVariant: "outline",
    footerLeft: "AED 12,850 YTD",
    routeHref: "/expenses",
    category: "Expenses",
  },
  {
    id: "rep-06",
    title: "Investor Report",
    description:
      "Review partner capital, 40%/35% profit shares, disbursed settlements.",
    iconType: "investor",
    badge: "EQUITY 40%",
    badgeVariant: "outline",
    footerLeft: "6 Partners",
    routeHref: "/investors",
    category: "Investors",
  },
  {
    id: "rep-07",
    title: "Profit & Loss Statement",
    description:
      "Consolidated audited IFRS-9 / DIFC statements and net yields.",
    iconType: "profit-loss",
    badge: "IFRS-9 / DIFC",
    badgeVariant: "solid",
    footerLeft: "Audited MTD",
    routeHref: "/profit-loss",
    category: "Financial",
  },
  {
    id: "rep-08",
    title: "Balance Sheet Report",
    description:
      "Point-in-time Assets = Liabilities + Equity balance verification.",
    iconType: "balance-sheet",
    badge: "BALANCED",
    badgeVariant: "outline",
    footerLeft: "Δ 0.00 Variance",
    routeHref: "/balance-sheet",
    category: "Financial",
  },
  {
    id: "rep-09",
    title: "Settlement Report",
    description:
      "Investor disbursement records, pending balances, and bank wires.",
    iconType: "settlement",
    badge: "SETTLED",
    badgeVariant: "solid",
    footerLeft: "Ready for Wire",
    routeHref: "/investors",
    category: "Investors",
  },
];
