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
    ["Total Purchase Cost (AED)", data.kpis.purchaseCostAED],
    ["Total Operating Expenses (AED)", data.kpis.totalExpensesAED],
    ["Gross Profit (AED)", data.kpis.grossProfitAED],
    ["Net Operating Profit (AED)", data.kpis.netProfitAED],
    [],
    ["--- PROFIT & LOSS STATEMENT LEDGER ---", "AMOUNT (AED)"],
    ["1. TRADING REVENUE", ""],
  ];

  for (const item of data.statement.tradingRevenue) {
    summarySheetData.push([`   ${item.title}`, item.amountAED]);
  }
  summarySheetData.push(["   TOTAL REVENUE", data.statement.totalRevenueAED]);

  summarySheetData.push(["2. COST OF BULLION PURCHASED", ""]);
  for (const item of data.statement.costOfBullion) {
    summarySheetData.push([`   ${item.title}`, item.amountAED]);
  }
  summarySheetData.push(["   TOTAL PURCHASE COST", data.statement.totalPurchaseCostAED]);

  summarySheetData.push([
    `GROSS PROFIT (Spread Margin: ${data.statement.grossSpreadMarginPercent.toFixed(2)}%)`,
    data.statement.grossProfitAED,
  ]);

  summarySheetData.push(["3. OPERATING & TRADING LOGISTICS EXPENSES", ""]);
  for (const exp of data.statement.operatingExpenses) {
    summarySheetData.push([`   ${exp.title}`, exp.amountAED]);
  }
  summarySheetData.push(["   TOTAL EXPENSES", data.statement.totalExpensesAED]);

  summarySheetData.push([
    `NET OPERATING PROFIT (Net Margin: ${data.statement.netMarginPercent.toFixed(2)}%)`,
    data.statement.netProfitAED ?? data.statement.auditedNetProfitAED ?? 0,
  ]);

  summarySheetData.push([
    `4. LESS CONTRACTED INVESTOR SHARE (${data.statement.investorSharePercent.toFixed(2)}%)`,
    -data.statement.investorShareAED,
  ]);
  summarySheetData.push([
    `NET DESK RETAINED PROFIT (${data.statement.deskRetainedPercent.toFixed(2)}%)`,
    data.statement.netDeskRetainedProfitAED,
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
      ["Business Name", "Sales (AED)", "Purchase (AED)", "Expenses (AED)", "Gross Profit (AED)", "Net Profit (AED)", "Net Margin (%)"],
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
    wsBiz["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
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

  // ==========================================
  // SHEET 4: Partner / Investor Allocations
  // ==========================================
  if (data.allocations?.partners && data.allocations.partners.length > 0) {
    const allocSheetData: (string | number)[][] = [
      ["INVESTOR & PARTNER ALLOCATIONS"],
      ["Total Net Profit (AED)", data.allocations.totalNetProfitAED],
      ["Total Investor Share (AED)", data.allocations.investorShareAED],
      ["Total Desk Retained (AED)", data.allocations.deskShareAED],
      [],
      ["Partner Name", "Business Entity", "Allocated Profit (AED)", "Paid Disbursals (AED)", "Pending Balance (AED)"],
    ];

    for (const p of data.allocations.partners) {
      allocSheetData.push([
        p.partnerName,
        p.businessName,
        p.allocatedProfitAED,
        p.paidAED,
        p.pendingAED,
      ]);
    }

    const wsAlloc = XLSX.utils.aoa_to_sheet(allocSheetData);
    wsAlloc["!cols"] = [{ wch: 25 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsAlloc, "Partner Allocations");
  }

  const safeBizSlug = businessName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `Ivora-Profit-Loss-${safeBizSlug}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
