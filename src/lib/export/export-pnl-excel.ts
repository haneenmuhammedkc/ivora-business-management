import * as XLSX from "xlsx";
import { ProfitLossResponseData } from "@/types/profit-loss";
import { PnlExportOptions } from "./export-pnl-pdf";

export function exportProfitLossToExcel(
  data: ProfitLossResponseData,
  options: PnlExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  const businessName = options.businessName || "Consolidated (All Businesses)";
  const period = options.periodLabel || "This Month";
  const dateRange =
    options.startDate && options.endDate
      ? `${options.startDate} to ${options.endDate}`
      : period;

  const formatRevenueTitle = (title: string) => {
    if (title.includes("India Sales") || title.includes("Realization Protocol") || title.includes("Sales Transactions")) {
      return "Sales";
    }
    return title;
  };

  const formatPurchaseTitle = (title: string) => {
    if (title.includes("Dubai Physical Bullion") || title.includes("Fine Sourcing") || title.includes("Purchase Transactions")) {
      return "Purchase Cost";
    }
    return title;
  };

  // ==========================================
  // SHEET 1: P&L Summary & Statement
  // ==========================================
  const summarySheetData: (string | number)[][] = [
    ["IVORA — PROFIT & LOSS STATEMENT"],
    ["Generated At", new Date().toISOString()],
    ["Entity Scope", businessName],
    ["Period", dateRange],
    ["Currency", "AED"],
    [],
    ["--- KEY PERFORMANCE METRICS ---", ""],
    ["Total Sales (AED)", data.kpis.totalSalesAED],
    ["Purchase Cost (AED)", data.kpis.purchaseCostAED],
    ["Operating Expenses (AED)", data.kpis.totalExpensesAED],
    ["Gross Profit (AED)", data.kpis.grossProfitAED],
    ["Net Profit (AED)", data.kpis.netProfitAED],
    [],
    ["--- PROFIT & LOSS STATEMENT ---", "AMOUNT (AED)"],
    ["1. REVENUE (TOTAL SALES)", ""],
  ];

  for (const item of data.statement.tradingRevenue) {
    summarySheetData.push([`   ${formatRevenueTitle(item.title)}`, item.amountAED]);
  }
  summarySheetData.push(["   TOTAL SALES", data.statement.totalRevenueAED]);

  summarySheetData.push(["2. LESS: PURCHASE COST", ""]);
  for (const item of data.statement.costOfBullion) {
    summarySheetData.push([`   ${formatPurchaseTitle(item.title)}`, item.amountAED]);
  }
  summarySheetData.push(["   PURCHASE COST", data.statement.totalPurchaseCostAED]);

  summarySheetData.push([
    `GROSS PROFIT (Gross Margin: ${data.statement.grossSpreadMarginPercent.toFixed(2)}%)`,
    data.statement.grossProfitAED,
  ]);

  summarySheetData.push(["3. LESS: OPERATING EXPENSES", ""]);
  for (const exp of data.statement.operatingExpenses) {
    summarySheetData.push([`   ${exp.title}`, exp.amountAED]);
  }
  summarySheetData.push(["   OPERATING EXPENSES", data.statement.totalExpensesAED]);

  summarySheetData.push([
    `NET PROFIT (Net Margin: ${data.statement.netMarginPercent.toFixed(2)}%)`,
    data.statement.netProfitAED ?? data.statement.auditedNetProfitAED ?? 0,
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary["!cols"] = [{ wch: 45 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "P&L Summary");

  // ==========================================
  // SHEET 2: Business Profitability Breakdown
  // ==========================================
  if (data.businesses && data.businesses.length > 0) {
    const bizSheetData: (string | number)[][] = [
      ["BUSINESS PROFITABILITY COMPARISON"],
      ["Scope", businessName],
      ["Period", dateRange],
      [],
      ["Business Name", "Total Sales (AED)", "Purchase Cost (AED)", "Operating Expenses (AED)", "Gross Profit (AED)", "Net Profit (AED)", "Net Margin (%)"],
    ];

    for (const b of data.businesses) {
      bizSheetData.push([
        b.name,
        b.salesAED,
        b.purchaseAED,
        b.expensesAED,
        b.grossProfitAED,
        b.netProfitAED,
        b.netMarginPercent,
      ]);
    }

    const wsBiz = XLSX.utils.aoa_to_sheet(bizSheetData);
    wsBiz["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsBiz, "Business Profitability");
  }

  // ==========================================
  // SHEET 3: Operating Expenses Analysis
  // ==========================================
  if (data.statement.operatingExpenses && data.statement.operatingExpenses.length > 0) {
    const totalExp = data.kpis.totalExpensesAED || 1;
    const expSheetData: (string | number)[][] = [
      ["OPERATING EXPENSES BREAKDOWN"],
      ["Period", dateRange],
      [],
      ["Expense Category", "Amount (AED)", "Share of Expenses (%)"],
    ];

    for (const exp of data.statement.operatingExpenses) {
      const share = Number(((exp.amountAED / totalExp) * 100).toFixed(2));
      expSheetData.push([exp.title, exp.amountAED, share]);
    }
    expSheetData.push(["TOTAL OPERATING EXPENSES", data.kpis.totalExpensesAED, 100]);

    const wsExp = XLSX.utils.aoa_to_sheet(expSheetData);
    wsExp["!cols"] = [{ wch: 45 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsExp, "Operating Expenses");
  }

  const safeBizSlug = businessName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `Ivora-Profit-Loss-${safeBizSlug}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
