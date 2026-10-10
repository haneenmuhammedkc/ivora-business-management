import * as XLSX from "xlsx";
import { InvestorRecord } from "@/types/investors";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";

export interface InvestorExcelExportOptions {
  generatedBy?: string;
}

export function exportInvestorToExcel(
  investor: InvestorRecord,
  settlement: InvestorSettlementOverview | null
) {
  const wb = XLSX.utils.book_new();

  const generatedAt = new Date().toISOString();
  const pType = investor.participantType || settlement?.investor?.participantType || "INVESTOR";
  const totalInvestmentAED = settlement ? settlement.totalInvestmentAED : (investor.details?.totalInvestmentAED ?? investor.investmentAED);
  const sharePct = settlement ? settlement.contractualSharePct : (investor.sharePercent ?? 0);
  const allocatedProfitAED = settlement ? settlement.allocatedProfitAED : (investor.details?.allocatedProfit ?? 0);
  const totalDueAED = settlement ? settlement.totalDueAED : (totalInvestmentAED + allocatedProfitAED);
  const totalPaidAED = settlement ? settlement.totalPaidAED : (investor.details?.paidAmount ?? 0);
  const capitalPaidAED = settlement ? settlement.totalCapitalPaidAED : 0;
  const profitPaidAED = settlement ? settlement.totalProfitPaidAED : 0;
  const outstandingAED = settlement ? settlement.totalOutstandingAED : (investor.details?.outstandingBalance ?? 0);
  const outstandingCapitalAED = settlement ? settlement.outstandingCapitalAED : 0;
  const outstandingProfitAED = settlement ? settlement.outstandingProfitAED : 0;
  const isSettled = settlement?.isFullySettled || investor.status === "SETTLED";
  const statusLabel = isSettled ? "SETTLED" : (investor.status || "ACTIVE");

  // ==========================================
  // SHEET 1: Investor Summary
  // ==========================================
  const summarySheetData: (string | number)[][] = [
    ["IVORA — INVESTOR SETTLEMENT STATEMENT"],
    ["Generated At", generatedAt],
    ["Currency", "AED"],
    [],
    ["--- PARTICIPANT PROFILE ---", ""],
    ["Investor Name", investor.name],
    ["Investor Code", investor.code || "—"],
    ["Participant Role", pType],
    ["Assigned Business", investor.business || "—"],
    ["Email Address", investor.email || "—"],
    ["Phone Number", investor.phone || "—"],
    ["Investment Date", investor.date || "—"],
    ["Settlement Status", statusLabel],
    [],
    ["--- FINANCIAL BALANCES ---", "AMOUNT (AED)", "NOTES / DETAILS"],
    ["Total Committed Investment", totalInvestmentAED, "Active capital stake"],
    ["Contractual Profit Share", sharePct, `${sharePct}% stake`],
    ["Allocated Profit", allocatedProfitAED, "Contractual / Persisted net profit share"],
    ["Total Investor Due", totalDueAED, "Total Investment + Allocated Profit"],
    ["Capital Paid / Returned", capitalPaidAED, "Cumulative capital disbursements"],
    ["Profit Paid / Disbursed", profitPaidAED, "Cumulative profit disbursements"],
    ["Total Paid / Disbursed", totalPaidAED, "Cumulative settlements to date"],
    ["Outstanding Capital Due", outstandingCapitalAED, "Remaining capital to be returned"],
    ["Outstanding Profit Due", outstandingProfitAED, "Remaining profit to be disbursed"],
    ["Total Outstanding Due", outstandingAED, "Net pending settlement entitlement"],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary["!cols"] = [{ wch: 35 }, { wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Investor Summary");

  // ==========================================
  // SHEET 2: Disbursal History
  // ==========================================
  const paymentHistory = settlement?.paymentHistory || [];
  const historySheetData: (string | number)[][] = [
    ["SETTLEMENT DISBURSAL PAYMENT HISTORY"],
    ["Investor", `${investor.name} (${investor.code || "INV"})`],
    ["Assigned Business", investor.business || "—"],
    ["Total Disbursed (AED)", totalPaidAED],
    [],
    [
      "Payment Date",
      "Payment Reference",
      "Payment Method",
      "Capital Returned (AED)",
      "Profit Disbursed (AED)",
      "Total Disbursed (AED)",
      "Bank Reference",
      "Escrow Account",
      "Status",
    ],
  ];

  if (paymentHistory.length === 0) {
    historySheetData.push(["—", "No disbursal payments recorded to date", "—", 0, 0, 0, "—", "—", "PENDING"]);
  } else {
    for (const item of paymentHistory) {
      historySheetData.push([
        item.date,
        item.paymentReference || "—",
        item.paymentMethod,
        item.capitalReturned,
        item.profitDisbursed,
        item.totalPayment,
        item.bankReference || "—",
        item.escrowAccount || "—",
        item.status || "CLEARED",
      ]);
    }
  }

  const wsHistory = XLSX.utils.aoa_to_sheet(historySheetData);
  wsHistory["!cols"] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHistory, "Disbursal History");

  // Trigger Download
  const sanitizedName = (investor.name || "investor").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const sanitizedCode = (investor.code || "inv").toLowerCase().replace(/[^a-z0-9]/g, "_");
  XLSX.writeFile(wb, `ivora-investor-${sanitizedName}-${sanitizedCode}-statement.xlsx`);
}
