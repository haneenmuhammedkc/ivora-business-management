import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvestorWalletSummary, WalletEntryDTO } from "@/types/wallet";

export interface WalletPdfExportOptions {
  filteredEntries?: WalletEntryDTO[];
  dateRangeLabel?: string;
  typeFilterLabel?: string;
}

export function exportWalletLedgerToPdf(
  walletSummary: InvestorWalletSummary,
  options?: WalletPdfExportOptions
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();

  const timeFormatted = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const { investor, wallet } = walletSummary;
  const entriesToExport = options?.filteredEntries || walletSummary.recentEntries;

  const brandDark: [number, number, number] = [12, 13, 18]; // #0c0d12
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const borderLight: [number, number, number] = [226, 232, 240]; // #e2e8f0

  // Header Banner across 297mm
  doc.setFillColor(...brandDark);
  doc.rect(0, 0, 297, 20, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("IVORA", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text("SETTLEMENT & FUND LEDGER STATEMENT", 35, 13);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`${dateFormatted} • ${timeFormatted}`, 283, 13, { align: "right" });

  let y = 26;

  // Metadata block (Strictly ledger & investor details; no summary cards)
  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 1.8, font: "helvetica" },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 32 },
      1: { textColor: [15, 23, 42], cellWidth: 65 },
      2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 32 },
      3: { textColor: [15, 23, 42], cellWidth: 65 },
      4: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 32 },
      5: { textColor: [15, 23, 42], cellWidth: 43 },
    },
    body: [
      [
        "Investor Name", investor.name,
        "Transaction Filter", options?.typeFilterLabel || "All Records",
        "Currency", wallet.currency || "AED",
      ],
      [
        "Investor Code", investor.code,
        "Date Range", options?.dateRangeLabel || "All Dates",
        "Total Records", `${entriesToExport.length}`,
      ],
    ],
  });

  const finalOverviewY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  y = finalOverviewY;

  // Ledger Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandDark);
  doc.text("TRANSACTION LEDGER & AUDIT TRAIL", 14, y);

  y += 3;

  const tableRows = entriesToExport.map((e) => {
    const formattedType = e.type.replace(/_/g, " ");

    const debitAmt =
      e.direction === "DEBIT"
        ? `AED ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";

    const creditAmt =
      e.direction === "CREDIT" || e.category === "DIRECT_PAYMENT"
        ? `AED ${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";

    const balanceAfterStr =
      e.balanceAfter !== null && e.balanceAfter !== undefined
        ? `AED ${e.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : e.category === "INTERNAL_TRANSFER"
        ? "— (Transfer)"
        : e.category === "FRESH_CAPITAL"
        ? "— (Equity)"
        : "— (Direct Payout)";

    const entityRef = e.businessName
      ? e.reference
        ? `${e.businessName} (${e.reference})`
        : e.businessName
      : e.reference || "—";

    return [
      new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      e.entryCode,
      formattedType,
      e.description,
      entityRef,
      debitAmt,
      creditAmt,
      balanceAfterStr,
    ];
  });

  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [["Date", "Entry Code", "Type", "Description", "Entity / Reference", "Debit", "Credit", "Balance After"]],
    body: tableRows,
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      font: "helvetica",
      textColor: [30, 41, 59],
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 36, fontStyle: "bold" },
      2: { cellWidth: 34 },
      3: { cellWidth: 68 },
      4: { cellWidth: 41 },
      5: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      6: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      7: { cellWidth: 24, halign: "right" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderLight);
    doc.line(14, 198, 283, 198);

    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      `Ivora Business Management • Official Investor Settlement & Reinvestment Ledger • Confidential`,
      14,
      203
    );
    doc.text(`Page ${i} of ${totalPages}`, 283, 203, { align: "right" });
  }

  const dateStr = now.toISOString().split("T")[0];
  const filename = `Ivora_Settlement_Ledger_${investor.code}_${dateStr}.pdf`;
  doc.save(filename);
}
