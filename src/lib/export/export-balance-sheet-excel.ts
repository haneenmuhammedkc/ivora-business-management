import * as XLSX from "xlsx";
import { BalanceSheetResponseData } from "@/types/balance-sheet";
import { BalanceSheetExportOptions } from "./export-balance-sheet-pdf";

export function exportBalanceSheetToExcel(
  data: BalanceSheetResponseData,
  options: BalanceSheetExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  const businessName = options.businessName || data.businessScope || "Consolidated Portfolio";
  const asOfDate = options.asOfDate || data.asOfDate || new Date().toISOString().split("T")[0];

  // ==========================================
  // SHEET 1: Position Summary
  // ==========================================
  const summarySheetData: (string | number)[][] = [
    ["IVORA — BALANCE SHEET"],
    ["Financial Position & Holdings"],
    ["Generated At", new Date().toISOString()],
    ["Entity Scope", businessName],
    ["As of Date", asOfDate],
    ["Currency", "AED"],
    [],
    ["--- KEY PERFORMANCE METRICS ---", ""],
    ["Total Invested Capital (AED)", data.kpis.totalCommittedCapitalAED],
    ["Inventory on Hand (AED)", data.kpis.inventoryCarryingValueAED],
    ["Sales (AED)", data.kpis.totalRealizedSalesAED],
    ["Net Profit (AED)", data.kpis.netOperatingProfitAED],
    ["Pending Disbursal (AED)", data.kpis.pendingPartnerDisbursalAED],
    [],
    ["--- 1. INVESTMENT & INVENTORY ---", "AMOUNT (AED)", "ALLOCATION / DETAILS"],
    ["Admin Capital", data.capital.adminCapitalAED, `${data.capital.adminSharePercent.toFixed(1)}% of capital pool`],
    ["Partner Capital", data.capital.partnerCapitalAED, `${data.capital.partnerSharePercent.toFixed(1)}% of capital pool`],
    ["Total Invested Capital", data.capital.totalCommittedCapitalAED, "100.0% of capital pool"],
    [
      "Inventory on Hand (at Landed Cost)",
      data.inventory.totalCarryingValueAED,
      `${data.inventory.totalStockGrams.toFixed(1)} gms stock @ avg AED ${data.inventory.averageCostPerGramAED.toFixed(2)}/g`,
    ],
    [],
    ["--- 2. SALES, COSTS & PROFIT ---", "AMOUNT (AED)", "DETAILS"],
    ["Sales", data.trading.realizedSalesAED, "Cumulative recognized revenue"],
    ["Purchase Cost", -data.trading.purchaseSourcingCostAED, "Cumulative purchases at landed cost"],
    ["Operating Expenses", -data.trading.operatingExpensesAED, "Cumulative operational overheads"],
    ["Net Profit", data.trading.operatingProfitAED, `Net Margin: ${data.trading.operatingMarginPercent.toFixed(2)}%`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary["!cols"] = [{ wch: 45 }, { wch: 22 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Balance Sheet");

  // ==========================================
  // SHEET 2: Inventory on Hand
  // ==========================================
  const invSheetData: (string | number)[][] = [
    ["INVENTORY ON HAND"],
    ["Entity Scope", businessName],
    ["As of Date", asOfDate],
    [],
    [
      "Business",
      "Product Type",
      "Stock Quantity (Grams)",
      "Avg Cost / Gram (AED)",
      "Inventory Value (AED)",
    ],
  ];

  for (const item of data.inventory.items) {
    invSheetData.push([
      item.businessName,
      item.productType.replace(/_/g, " "),
      item.remainingQuantity,
      item.averageCostPerUnitAED,
      item.carryingValueAED,
    ]);
  }

  invSheetData.push([
    "CONSOLIDATED TOTAL",
    "ALL INVENTORY",
    data.inventory.totalStockGrams,
    data.inventory.averageCostPerGramAED,
    data.inventory.totalCarryingValueAED,
  ]);

  const wsInventory = XLSX.utils.aoa_to_sheet(invSheetData);
  wsInventory["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 24 }, { wch: 22 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsInventory, "Inventory on Hand");

  // ==========================================
  // SHEET 3: Settlement Breakdown
  // ==========================================
  const settlementItems = data.settlementBreakdown || [];
  const settlementSheetData: (string | number)[][] = [
    ["INVESTOR SETTLEMENT BREAKDOWN"],
    ["As of Date", asOfDate],
    [],
    [
      "Business Name",
      "Business Code",
      "Investor Name",
      "Investor Code",
      "Investor Type",
      "Total Investment (AED)",
      "Profit Allocation (AED)",
      "Total Due (AED)",
      "Capital Paid (AED)",
      "Profit Paid (AED)",
      "Total Paid / Disbursed (AED)",
      "Outstanding Due (AED)",
      "Settlement Status",
    ],
  ];

  let totalInvSum = 0;
  let totalProfitSum = 0;
  let totalDueSum = 0;
  let totalCapPaidSum = 0;
  let totalProfPaidSum = 0;
  let totalPaidSum = 0;
  let totalOutstandingSum = 0;

  for (const s of settlementItems) {
    totalInvSum += s.totalInvestmentAED;
    totalProfitSum += s.profitAmountAED;
    totalDueSum += s.totalDueAED;
    totalCapPaidSum += s.capitalPaidAED;
    totalProfPaidSum += s.profitPaidAED;
    totalPaidSum += s.totalPaidAED;
    totalOutstandingSum += s.pendingOutstandingAED;

    settlementSheetData.push([
      s.businessName,
      s.businessCode,
      s.investorName,
      s.investorCode,
      s.investorType || "INVESTOR",
      s.totalInvestmentAED,
      s.profitAmountAED,
      s.totalDueAED,
      s.capitalPaidAED,
      s.profitPaidAED,
      s.totalPaidAED,
      s.pendingOutstandingAED,
      s.status,
    ]);
  }

  settlementSheetData.push([
    "PORTFOLIO TOTAL",
    "-",
    "-",
    "-",
    "-",
    totalInvSum,
    totalProfitSum,
    totalDueSum,
    totalCapPaidSum,
    totalProfPaidSum,
    totalPaidSum,
    totalOutstandingSum,
    "-",
  ]);

  const wsSettlement = XLSX.utils.aoa_to_sheet(settlementSheetData);
  wsSettlement["!cols"] = [
    { wch: 26 },
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 26 },
    { wch: 22 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlement, "Settlement Breakdown");

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  XLSX.writeFile(wb, `ivora-balance-sheet-${sanitizedBiz}-${asOfDate}.xlsx`);
}
