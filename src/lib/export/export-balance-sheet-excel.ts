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
    ["Pending Partner Disbursal (AED)", data.kpis.pendingPartnerDisbursalAED],
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
    [],
    ["--- 3. PARTNER SETTLEMENT ---", "AMOUNT (AED)", "DETAILS"],
    ["Partner Profit Entitlement", data.settlement.totalPartnerEntitlementAED, "Agreed equity profit share"],
    ["Paid Disbursals", -data.settlement.profitDisbursedAED, "Cumulative disbursed profits"],
    ["Pending Partner Disbursal", data.settlement.pendingPartnerDisbursalAED, "Unsettled payable balance"],
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
  // SHEET 3: Business Breakdown
  // ==========================================
  const bizSheetData: (string | number)[][] = [
    ["BUSINESS BREAKDOWN"],
    ["As of Date", asOfDate],
    [],
    [
      "Business Name",
      "Code",
      "Invested Capital (AED)",
      "Inventory Value (AED)",
      "Stock (Grams)",
      "Sales (AED)",
      "Purchase Cost (AED)",
      "Operating Expenses (AED)",
      "Net Profit (AED)",
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
  XLSX.utils.book_append_sheet(wb, wsBiz, "Business Breakdown");

  // ==========================================
  // SHEET 4: Partner Settlement Ledger
  // ==========================================
  const settlementSheetData: (string | number)[][] = [
    ["PARTNER SETTLEMENT"],
    ["As of Date", asOfDate],
    [],
    [
      "Business Name",
      "Partner Equity Share",
      "Partner Profit Entitlement (AED)",
      "Paid Disbursals (AED)",
      "Pending Partner Disbursal (AED)",
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
    { wch: 30 },
    { wch: 22 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlement, "Partner Settlements");

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  XLSX.writeFile(wb, `ivora-balance-sheet-${sanitizedBiz}-${asOfDate}.xlsx`);
}
