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
    ["IVORA — TRANSACTION-BASED FINANCIAL POSITION STATEMENT"],
    ["Generated At", new Date().toISOString()],
    ["Entity Scope", businessName],
    ["As of Date", asOfDate],
    ["Currency", "AED"],
    [],
    ["--- KEY PERFORMANCE METRICS ---", ""],
    ["Total Committed Capital (AED)", data.kpis.totalCommittedCapitalAED],
    ["Inventory Carrying Value (AED)", data.kpis.inventoryCarryingValueAED],
    ["Total Realized Sales (AED)", data.kpis.totalRealizedSalesAED],
    ["Net Operating Profit (AED)", data.kpis.netOperatingProfitAED],
    ["Pending Partner Disbursal (AED)", data.kpis.pendingPartnerDisbursalAED],
    [],
    ["--- 1. CAPITAL POSITION POOL ---", "AMOUNT (AED)", "DETAILS"],
  ];

  for (const item of data.capital.breakdown) {
    summarySheetData.push([item.name, item.amountAED, item.note || item.drilldown || ""]);
  }

  summarySheetData.push([], ["--- 2. CUMULATIVE TRADING POSITION ---", "AMOUNT (AED)", "DETAILS"]);
  for (const item of data.trading.breakdown) {
    summarySheetData.push([item.name, item.amountAED, item.note || item.drilldown || ""]);
  }

  summarySheetData.push([], ["--- 3. PARTNER SETTLEMENT POSITION ---", "AMOUNT (AED)", "DETAILS"]);
  for (const item of data.settlement.breakdown) {
    summarySheetData.push([item.name, item.amountAED, item.note || item.drilldown || ""]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary["!cols"] = [{ wch: 45 }, { wch: 22 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Position Statement");

  // ==========================================
  // SHEET 2: Bullion Inventory Valuation
  // ==========================================
  const invSheetData: (string | number)[][] = [
    ["PHYSICAL BULLION INVENTORY POSITION"],
    ["Entity Scope", businessName],
    ["As of Date", asOfDate],
    [],
    [
      "Entity",
      "Product Type",
      "Remaining Stock (Grams)",
      "Avg Cost / Gram (AED)",
      "Carrying Value (AED)",
    ],
  ];

  for (const item of data.inventory.items) {
    invSheetData.push([
      item.businessName,
      item.productType,
      item.remainingQuantity,
      item.averageCostPerUnitAED,
      item.carryingValueAED,
    ]);
  }

  invSheetData.push([
    "CONSOLIDATED TOTAL",
    "ALL BULLION",
    data.inventory.totalStockGrams,
    data.inventory.averageCostPerGramAED,
    data.inventory.totalCarryingValueAED,
  ]);

  const wsInventory = XLSX.utils.aoa_to_sheet(invSheetData);
  wsInventory["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 24 }, { wch: 22 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsInventory, "Inventory Position");

  // ==========================================
  // SHEET 3: Business Entity Comparison
  // ==========================================
  const bizSheetData: (string | number)[][] = [
    ["ENTITY FINANCIAL POSITION COMPARISON"],
    ["As of Date", asOfDate],
    [],
    [
      "Entity Name",
      "Code",
      "Committed Capital (AED)",
      "Inventory Value (AED)",
      "Stock (Grams)",
      "Realized Sales (AED)",
      "Purchase Cost (AED)",
      "Operating Expenses (AED)",
      "Operating Profit (AED)",
      "Pending Disbursal (AED)",
    ],
  ];

  for (const b of data.businesses) {
    bizSheetData.push([
      b.business,
      b.code,
      b.committedCapitalAED,
      b.inventoryValueAED,
      b.stockGrams,
      b.salesAED,
      b.purchaseAED,
      b.expensesAED,
      b.operatingProfitAED,
      b.pendingDisbursalAED,
    ]);
  }

  const wsBiz = XLSX.utils.aoa_to_sheet(bizSheetData);
  wsBiz["!cols"] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBiz, "Entity Comparison");

  // ==========================================
  // SHEET 4: Partner Settlement Ledger
  // ==========================================
  const settlementSheetData: (string | number)[][] = [
    ["PARTNER PROFIT SETTLEMENT LEDGER"],
    ["As of Date", asOfDate],
    [],
    [
      "Entity Name",
      "Partner Equity Share",
      "Entitlement (AED)",
      "Disbursed (AED)",
      "Pending Disbursal (AED)",
    ],
  ];

  for (const p of data.settlement.partners) {
    settlementSheetData.push([
      p.businessName,
      p.partnerName,
      p.entitlementAED,
      p.disbursedAED,
      p.pendingAED,
    ]);
  }

  settlementSheetData.push([
    "CONSOLIDATED TOTAL",
    "-",
    data.settlement.totalPartnerEntitlementAED,
    data.settlement.profitDisbursedAED,
    data.settlement.pendingPartnerDisbursalAED,
  ]);

  const wsSettlement = XLSX.utils.aoa_to_sheet(settlementSheetData);
  wsSettlement["!cols"] = [
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlement, "Partner Settlements");

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  XLSX.writeFile(wb, `ivora-financial-position-${sanitizedBiz}-${asOfDate}.xlsx`);
}
