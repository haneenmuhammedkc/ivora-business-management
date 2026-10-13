import * as XLSX from "xlsx";
import { InvestorWalletSummary, WalletEntryDTO } from "@/types/wallet";

export interface WalletExcelExportOptions {
  filteredEntries?: WalletEntryDTO[];
  dateRangeLabel?: string;
  typeFilterLabel?: string;
}

export function exportWalletLedgerToExcel(
  walletSummary: InvestorWalletSummary,
  options?: WalletExcelExportOptions
) {
  const wb = XLSX.utils.book_new();
  const generatedAt = new Date().toISOString();
  const { investor, wallet } = walletSummary;
  const entriesToExport = options?.filteredEntries || walletSummary.recentEntries;

  // ==========================================
  // SHEET: Investor Settlement & Fund Ledger
  // ==========================================
  const ledgerHeader: (string | number)[] = [
    "Date & Time",
    "Entry Code",
    "Transaction Type",
    "Category",
    "Description",
    "Entity / Business",
    "Reference",
    "Debit (AED)",
    "Credit (AED)",
    "Balance After (AED)",
    "Payment Method",
  ];

  const ledgerRows = entriesToExport.map((entry) => {
    const isDebit = entry.direction === "DEBIT";
    const isCredit = entry.direction === "CREDIT" || entry.category === "DIRECT_PAYMENT";

    const debitVal = isDebit ? entry.amount : "";
    const creditVal = isCredit ? entry.amount : "";

    const balanceAfterVal =
      entry.balanceAfter !== null && entry.balanceAfter !== undefined
        ? entry.balanceAfter
        : entry.category === "INTERNAL_TRANSFER"
        ? "— (Transfer)"
        : entry.category === "FRESH_CAPITAL"
        ? "— (Equity)"
        : "— (Direct Payout)";

    return [
      new Date(entry.createdAt).toLocaleString("en-GB"),
      entry.entryCode,
      entry.type.replace(/_/g, " "),
      entry.category.replace(/_/g, " "),
      entry.description || "—",
      entry.businessName || "—",
      entry.reference || "—",
      debitVal,
      creditVal,
      balanceAfterVal,
      entry.paymentMethod ? entry.paymentMethod.replace(/_/g, " ") : "N/A",
    ];
  });

  const ledgerSheetData = [
    ["IVORA — INVESTOR SETTLEMENT & REINVESTMENT LEDGER"],
    ["Investor Name", investor.name, "", "Date Range", options?.dateRangeLabel || "All Dates"],
    ["Investor Code", investor.code, "", "Filter Type", options?.typeFilterLabel || "All Types"],
    ["Currency", wallet.currency || "AED", "", "Total Records", entriesToExport.length],
    ["Exported At", generatedAt],
    [],
    ledgerHeader,
    ...ledgerRows,
  ];

  const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerSheetData);
  ledgerSheet["!cols"] = [
    { wch: 20 }, // Date & Time
    { wch: 32 }, // Entry Code
    { wch: 28 }, // Transaction Type
    { wch: 20 }, // Category
    { wch: 45 }, // Description
    { wch: 25 }, // Entity / Business
    { wch: 26 }, // Reference
    { wch: 16 }, // Debit (AED)
    { wch: 16 }, // Credit (AED)
    { wch: 20 }, // Balance After (AED)
    { wch: 22 }, // Payment Method
  ];

  XLSX.utils.book_append_sheet(wb, ledgerSheet, "Settlement Ledger");

  // Write and trigger download
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Ivora_Settlement_Ledger_${investor.code}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
