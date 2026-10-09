import * as XLSX from "xlsx";
import { ReportsOverviewResponse, DetailedReportResponse } from "@/types/reports";
import { ReportExportOptions } from "./export-report-pdf";

/**
 * Export Consolidated Reports Overview to Multi-Sheet Excel Workbook
 */
export function exportReportsOverviewExcel(
  data: ReportsOverviewResponse,
  options: ReportExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  const businessName = options.businessName || "Consolidated Portfolio (All Entities)";
  const period = options.periodLabel || "This Month";
  const dateRange =
    options.startDate && options.endDate
      ? `${options.startDate} to ${options.endDate}`
      : period;

  // ==========================================
  // SHEET 1: Executive Summary & KPIs
  // ==========================================
  const summarySheetData: (string | number)[][] = [
    ["IVORA — CONSOLIDATED EXECUTIVE REPORT"],
    ["Generated At", new Date().toISOString()],
    ["Entity Scope", businessName],
    ["Period / Range", dateRange],
    ["Reporting Currency", "AED"],
    [],
    ["--- KEY PERFORMANCE METRICS ---", "AMOUNT (AED)"],
    ["Total Sales Revenue", data.kpis.totalSalesAED],
    ["Total Bullion Purchase Cost", data.kpis.totalPurchaseAED],
    ["Total Operating Logistics Expenses", data.kpis.totalExpensesAED],
    ["Net Operating Profit", data.kpis.netProfitAED],
    ["Investor Profit Allocation Pool", data.kpis.investorShareAED],
    [],
    ["--- MONTHLY PERFORMANCE ---", ""],
    ["Current Month", data.quickDesk.monthly.currentMonthLabel],
    ["Month-to-Date Sales", data.quickDesk.monthly.totalSalesAED],
    ["Month-to-Date Purchases", data.quickDesk.monthly.totalPurchasesAED],
    ["Month-to-Date Expenses", data.quickDesk.monthly.totalExpensesAED],
    ["Month-to-Date Net Profit", data.quickDesk.monthly.netProfitAED],
    ["Profit Margin %", `${data.quickDesk.monthly.profitMarginPct.toFixed(2)}%`],
    ["Prior Month Sales", data.quickDesk.monthly.previousMonthSalesAED],
    ["Sales Growth %", `${data.quickDesk.monthly.salesGrowthPct.toFixed(2)}%`],
    [],
    ["--- TODAY'S DESK SUMMARY ---", ""],
    ["Purchase Orders Count", data.quickDesk.today.purchaseCount],
    ["Purchases Today (AED)", data.quickDesk.today.totalPurchasesAED],
    ["Sales Invoices Count", data.quickDesk.today.saleCount],
    ["Sales Today (AED)", data.quickDesk.today.totalSalesAED],
    ["Expenses Today (AED)", data.quickDesk.today.totalExpensesAED],
    ["Net Cash Flow Today (AED)", data.quickDesk.today.netCashAED],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

  // ==========================================
  // SHEET 2: Business Comparison
  // ==========================================
  const businessSheetData: (string | number)[][] = [
    ["Entity Name", "Entity Code", "Sales (AED)", "Purchases (AED)", "Expenses (AED)", "Net Profit (AED)", "Margin %", "Status"],
    ...data.quickDesk.business.map((b) => [
      b.name,
      b.code,
      b.totalSalesAED,
      b.totalPurchasesAED,
      b.totalExpensesAED,
      b.netProfitAED,
      `${b.marginPct.toFixed(2)}%`,
      b.status,
    ]),
  ];
  const wsBusiness = XLSX.utils.aoa_to_sheet(businessSheetData);
  XLSX.utils.book_append_sheet(wb, wsBusiness, "Entity Performance");

  // ==========================================
  // SHEET 3: Expense Analysis
  // ==========================================
  const expenseSheetData: (string | number)[][] = [
    ["Expense Category", "Transaction Count", "Total Amount (AED)", "Percentage of Total %"],
    ...data.quickDesk.expense.map((e) => [
      e.category,
      e.count,
      e.totalAmountAED,
      `${e.percentageOfTotal.toFixed(2)}%`,
    ]),
  ];
  const wsExpense = XLSX.utils.aoa_to_sheet(expenseSheetData);
  XLSX.utils.book_append_sheet(wb, wsExpense, "Expense Breakdown");

  // ==========================================
  // SHEET 4: Investor Yield Summary
  // ==========================================
  const investorSheetData: (string | number)[][] = [
    ["Investor Name", "Code", "Entity", "Type", "Committed Capital (AED)", "Profit Share %", "Estimated Profit (AED)", "Status"],
    ...data.quickDesk.investor.map((inv) => [
      inv.name,
      inv.code,
      inv.businessName,
      inv.type,
      inv.committedCapitalAED,
      `${inv.profitSharePct.toFixed(2)}%`,
      inv.estimatedProfitAED,
      inv.status,
    ]),
  ];
  const wsInvestor = XLSX.utils.aoa_to_sheet(investorSheetData);
  XLSX.utils.book_append_sheet(wb, wsInvestor, "Investors");

  const safeFilename = `ivora-executive-report-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Export Detailed Report to Excel
 */
export function exportDetailedReportExcel(data: DetailedReportResponse) {
  const wb = XLSX.utils.book_new();

  const sheetData: (string | number)[][] = [
    [`IVORA — ${data.title.toUpperCase()}`],
    ["Entity Scope", data.entityScope],
    ["Period / Range", data.dateRange],
    ["Generated At", new Date().toISOString()],
    [],
    data.columns.map((col) => col.label),
    ...data.rows.map((row) => data.columns.map((col) => row[col.key] ?? "")),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, data.title.substring(0, 30));

  const safeFilename = `ivora-${data.reportType}-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Export Detailed Report to CSV
 */
export function exportDetailedReportCsv(data: DetailedReportResponse) {
  const headers = data.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const rows = data.rows.map((row) =>
    data.columns
      .map((col) => {
        const val = row[col.key] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ivora-${data.reportType}-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
