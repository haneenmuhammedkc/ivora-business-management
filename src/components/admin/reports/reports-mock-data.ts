import {
  ReportCardItem,
  ReportsSummaryKPIs,
  QuickDeskTabItem,
} from "@/types/reports";

export const mockReportsKPIs: ReportsSummaryKPIs = {
  totalSalesAED: 0,
  totalPurchaseAED: 0,
  totalExpensesAED: 0,
  netProfitAED: 0,
  investorShareAED: 0,
};

export const mockQuickDeskTabs: QuickDeskTabItem[] = [
  { id: "today", label: "Today's Activity" },
  { id: "monthly", label: "Monthly Performance" },
  { id: "business", label: "Business Comparison" },
  { id: "investor", label: "Investor Summary" },
  { id: "expense", label: "Expense Analysis" },
];

export const mockReportCards: ReportCardItem[] = [
  {
    id: "rep-01",
    reportKey: "business-performance",
    title: "Business Performance",
    description:
      "Compare sales, purchases, expenses and profitability across businesses.",
    iconType: "chart",
    badge: "MULTI-ENTITY",
    badgeVariant: "outline",
    footerLeft: "Multi-Entity Comparison",
    routeHref: "/businesses",
    category: "Business",
  },
  {
    id: "rep-02",
    reportKey: "purchase-report",
    title: "Purchase Report",
    description:
      "Analyze bullion purchases, weights and quantities, supplier terms, and landed costs.",
    iconType: "purchase",
    badge: "PURCHASE DESK",
    badgeVariant: "outline",
    footerLeft: "Bullion Acquisitions",
    routeHref: "/purchase",
    category: "Purchase",
  },
  {
    id: "rep-03",
    reportKey: "sales-report",
    title: "Sales Report",
    description:
      "Analyze sales, buyer firm realization, hedged FX settlement, and AED proceeds.",
    iconType: "sales",
    badge: "CROSS-BORDER",
    badgeVariant: "outline",
    footerLeft: "Settled Proceeds",
    routeHref: "/sales",
    category: "Sales",
  },
  {
    id: "rep-05",
    reportKey: "expense-report",
    title: "Expense Report",
    description:
      "Analyze logistics, freight, vault labour, customs, and bank FX charges.",
    iconType: "expense",
    badge: "ITEMIZED",
    badgeVariant: "outline",
    footerLeft: "Operating Logistics",
    routeHref: "/expenses",
    category: "Expenses",
  },
  {
    id: "rep-06",
    reportKey: "investor-report",
    title: "Investor Report",
    description:
      "Review partner capital, profit allocations, equity percentages, and distributions.",
    iconType: "investor",
    badge: "EQUITY POOL",
    badgeVariant: "outline",
    footerLeft: "Capital Commitments",
    routeHref: "/investors",
    category: "Investors",
  },
  {
    id: "rep-07",
    reportKey: "profit-loss",
    title: "Profit & Loss Statement",
    description:
      "Consolidated audited IFRS-9 / DIFC statements and net yields.",
    iconType: "profit-loss",
    badge: "IFRS-9 / DIFC",
    badgeVariant: "solid",
    footerLeft: "Audited Financials",
    routeHref: "/profit-loss",
    category: "Financial",
  },
  {
    id: "rep-08",
    reportKey: "balance-sheet",
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
    reportKey: "settlement-report",
    title: "Settlement Report",
    description:
      "Investor disbursement records, pending balances, and bank wire transactions.",
    iconType: "settlement",
    badge: "SETTLED",
    badgeVariant: "solid",
    footerLeft: "Disbursements Ledger",
    routeHref: "/investors",
    category: "Investors",
  },
];
