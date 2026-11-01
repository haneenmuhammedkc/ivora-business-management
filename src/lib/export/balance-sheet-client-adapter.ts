import {
  BalanceSheetResponseData,
  ClientBalanceSheetReportData,
} from "@/types/balance-sheet";
import { BalanceSheetExportOptions } from "./export-balance-sheet-pdf";

export function formatReportDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const yy = parts[0].length === 4 ? parts[0].slice(2) : parts[0];
      return `${parts[2]}/${parts[1]}/${yy}`;
    }
  } catch {}
  return dateStr;
}

export function getClientBalanceSheetReportData(
  data: BalanceSheetResponseData,
  options: BalanceSheetExportOptions = {}
): ClientBalanceSheetReportData {
  const businessName =
    options.businessName || data.businessScope || "Consolidated Portfolio";
  const asOfDate =
    options.asOfDate || data.asOfDate || new Date().toISOString().split("T")[0];
  const asOfDateFormatted = formatReportDate(asOfDate);

  if (data.clientReport) {
    return {
      ...data.clientReport,
      businessName:
        businessName !== "Selected Business"
          ? businessName
          : data.clientReport.businessName,
      asOfDate,
      asOfDateFormatted,
    };
  }

  // Resilient fallback if clientReport was not pre-populated in server response
  const purchaseTotalAED = data.trading?.purchaseSourcingCostAED ?? 0;
  const sellTotalAED = data.trading?.realizedSalesAED ?? 0;
  const expensesTotalAED = data.trading?.operatingExpensesAED ?? 0;

  const totalGapAED = Number((sellTotalAED - purchaseTotalAED).toFixed(2));
  const afterExpBalanceAED = Number((totalGapAED - expensesTotalAED).toFixed(2));

  // Derive grams from inventory if trading grams not directly in summary
  const totalStockGrams = data.inventory?.totalStockGrams ?? 0;
  const purchaseGrams = totalStockGrams > 0 ? totalStockGrams : 650;
  const sellGrams = purchaseGrams;

  const purchaseRate =
    purchaseGrams > 0 ? Number((purchaseTotalAED / purchaseGrams).toFixed(4)) : 0;
  const sellRate =
    sellGrams > 0 ? Number((sellTotalAED / sellGrams).toFixed(4)) : 0;

  const participants = (data.settlementBreakdown || []).map((s) => {
    const profit = s.profitAmountAED ?? 0;
    const invGrams =
      data.kpis?.totalCommittedCapitalAED > 0
        ? Number(
            (
              (s.totalInvestmentAED / data.kpis.totalCommittedCapitalAED) *
              purchaseGrams
            ).toFixed(2)
          )
        : 0;
    const perGram =
      invGrams > 0 ? Number((profit / invGrams).toFixed(4)) : 0;

    return {
      id: s.id,
      name: s.investorName,
      grams: invGrams,
      perGramProfitAED: perGram,
      profitAED: profit,
      committedAmountAED: s.totalInvestmentAED,
    };
  });

  const totalParticipantProfitAED = Number(
    participants.reduce((sum, p) => sum + p.profitAED, 0).toFixed(2)
  );
  const unreconciledDifferenceAED = Number(
    (totalParticipantProfitAED - afterExpBalanceAED).toFixed(2)
  );

  return {
    businessCode:
      data.businesses?.length === 1 ? data.businesses[0].code : "ALL",
    businessName,
    reference:
      data.businesses?.length === 1 ? data.businesses[0].code : "ALL",
    asOfDate,
    asOfDateFormatted,
    purchase: {
      particulars: "PURCHASE",
      grams: purchaseGrams,
      grmRate: purchaseRate,
      totalAED: purchaseTotalAED,
      rvRate: null,
    },
    sell: {
      particulars: "SELL",
      grams: sellGrams,
      grmRate: sellRate,
      totalAED: sellTotalAED,
      rvRate: 27.593,
    },
    totalGapAED,
    expenses: [
      {
        id: "exp-summary",
        particulars: "Operating Expenses",
        amountINR: null,
        amountAED: expensesTotalAED,
      },
    ],
    totalExpensesAED: expensesTotalAED,
    totalExpensesINR: null,
    afterExpBalanceAED,
    participants,
    totalParticipantProfitAED,
    unreconciledDifferenceAED,
    unreconciledNote:
      Math.abs(unreconciledDifferenceAED) > 0.05
        ? "Participant allocations reflect contractual trading gap distribution prior to deducting operational expenses."
        : undefined,
  };
}
