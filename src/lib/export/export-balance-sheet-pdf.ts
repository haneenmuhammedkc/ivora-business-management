import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BalanceSheetResponseData } from "@/types/balance-sheet";
import { getClientBalanceSheetReportData } from "./balance-sheet-client-adapter";

export interface BalanceSheetExportOptions {
  businessName?: string;
  asOfDate?: string;
  statusLabel?: string;
  productLabel?: string;
}

export function exportBalanceSheetToPdf(
  data: BalanceSheetResponseData,
  options: BalanceSheetExportOptions = {}
) {
  const report = getClientBalanceSheetReportData(data, options);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Primary brand theme colors (matching existing Ivora financial report aesthetic)
  const brandDark = [15, 23, 42] as [number, number, number]; // Slate 900
  const textMuted = [100, 116, 139] as [number, number, number]; // Slate 500
  const bgLight = [248, 250, 252] as [number, number, number]; // Slate 50
  const borderLight = [226, 232, 240] as [number, number, number]; // Slate 200
  const highlightGreen = [240, 253, 244] as [number, number, number]; // Emerald 50
  const textGreen = [22, 101, 52] as [number, number, number]; // Emerald 800

  // 1. Top Header Banner (24mm height for refined brand presence)
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text("IVORA — BALANCE SHEET STATEMENT", 14, 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text("CLIENT-FORMAT SETTLEMENT & REALIZATION RECORD", 14, 18);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(7.5);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 18, { align: "right" });

  let currentY = 30;

  // 2. Section A: Business Heading (Spacious Metadata Box: 26mm height)
  // Shared boundary: X = 14mm, width = 182mm (ends at 196mm)
  const metaBoxHeight = 26;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, metaBoxHeight, 2, 2, "FD");

  // Row 1 (y = currentY + 8.5)
  // Col 1: Business / Reference
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("BUSINESS / REFERENCE:", 20, currentY + 8.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(report.reference || report.businessCode || "—", 66, currentY + 8.5);

  // Col 2: Date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("DATE:", 136, currentY + 8.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(report.asOfDateFormatted, 156, currentY + 8.5);

  // Row 2 (y = currentY + 18.5)
  // Col 1: Business / Participant
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("BUSINESS / PARTICIPANT:", 20, currentY + 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  const displayBiz =
    report.businessName && report.businessName.length > 34
      ? `${report.businessName.slice(0, 32)}...`
      : report.businessName || "—";
  doc.text(displayBiz, 66, currentY + 18.5);

  // Col 2: Currency
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("CURRENCY:", 136, currentY + 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("AED / INR", 156, currentY + 18.5);

  currentY += metaBoxHeight + 8;

  // Dynamic Page Space Helper
  const ensurePageSpace = (neededHeight: number) => {
    if (currentY + neededHeight > 268) {
      doc.addPage();
      currentY = 24;
    }
  };

  // Helper for Section Titles with subtle accent rule
  const addSectionTitle = (title: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text(title.toUpperCase(), 14, yPos);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 2.5, 196, yPos + 2.5);

    doc.setDrawColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.setLineWidth(1.0);
    doc.line(14, yPos + 2.5, 34, yPos + 2.5);

    return yPos + 6.5;
  };

  // 3. Section B: Purchase & Sale Summary Table
  ensurePageSpace(45);
  currentY = addSectionTitle("1. Purchase & Sale Summary", currentY);

  const purchaseRateStr = report.purchase.grmRate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const purchaseTotalStr = report.purchase.totalAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sellRateStr = report.sell.grmRate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const sellTotalStr = report.sell.totalAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const rvRateStr =
    report.sell.rvRate !== null && report.sell.rvRate !== undefined
      ? typeof report.sell.rvRate === "number"
        ? report.sell.rvRate.toFixed(4)
        : String(report.sell.rvRate)
      : "—";

  const totalGapStr = report.totalGapAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tradingBody = [
    [
      "PURCHASE",
      report.purchase.grams.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }),
      purchaseRateStr,
      `AED ${purchaseTotalStr}`,
      "—",
    ],
    [
      "SELL",
      report.sell.grams.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }),
      sellRateStr,
      `AED ${sellTotalStr}`,
      rvRateStr,
    ],
    ["TOTAL GAP", "", "", `AED ${totalGapStr}`, ""],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14, top: 24, bottom: 20 },
    tableWidth: 182,
    showHead: "everyPage",
    head: [["PARTICULARS", "GRM", "GRM RATE", "TOTAL (AED)", "RV RATE"]],
    body: tradingBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      minCellHeight: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      valign: "middle",
      cellPadding: { top: 3.2, bottom: 3.2, left: 3, right: 3 },
      minCellHeight: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: 32, halign: "right" },
      2: { cellWidth: 32, halign: "right" },
      3: { cellWidth: 46, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 30, halign: "center" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 2) {
        hookData.cell.styles.fillColor = [241, 245, 249];
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.textColor = brandDark;
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // 4. Section C: Expense Breakdown Table
  ensurePageSpace(35);
  currentY = addSectionTitle("2. Expense Breakdown", currentY);

  const expenseBody: (string | number)[][] = report.expenses.map((e) => {
    const inrStr =
      e.amountINR !== null && e.amountINR !== undefined
        ? e.amountINR.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })
        : "—";
    const aedStr = `AED ${e.amountAED.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const label = e.description
      ? `${e.particulars} (${e.description})`
      : e.particulars;
    return [label, inrStr, aedStr];
  });

  const totalExpAedStr = report.totalExpensesAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const totalExpInrStr =
    report.totalExpensesINR !== null
      ? report.totalExpensesINR.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })
      : "—";

  expenseBody.push(["TOTAL EXP", totalExpInrStr, `AED ${totalExpAedStr}`]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14, top: 24, bottom: 20 },
    tableWidth: 182,
    showHead: "everyPage",
    head: [["PARTICULARS", "INR", "AED"]],
    body: expenseBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      minCellHeight: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      valign: "middle",
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      minCellHeight: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 82, fontStyle: "bold" },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 50, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        if (hookData.row.index === expenseBody.length - 1) {
          hookData.cell.styles.fillColor = [241, 245, 249];
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.textColor = brandDark;
        }
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // 5. Section D: After-Expense Balance Callout Box
  ensurePageSpace(22);
  const afterExpStr = report.afterExpBalanceAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const calloutHeight = 14;
  doc.setFillColor(highlightGreen[0], highlightGreen[1], highlightGreen[2]);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, calloutHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
  doc.text("AFTER EXP BALANCE", 20, currentY + 9);

  doc.setFontSize(11.5);
  doc.text(`AED ${afterExpStr}`, 190, currentY + 9, { align: "right" });

  currentY += calloutHeight + 9;

  // 6. Section E: Profit Allocation by Participant Table
  ensurePageSpace(32);
  currentY = addSectionTitle("3. Profit Allocation By Participant", currentY);

  const participantBody: (string | number)[][] = report.participants.map((p) => {
    const perGStr = p.perGramProfitAED.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    const gramsStr = p.grams.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const profitStr = `AED ${p.profitAED.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return [p.name, perGStr, gramsStr, profitStr];
  });

  const totalGramsSum = report.participants.reduce((sum, p) => sum + p.grams, 0);
  const totalAllocatedProfitStr = report.totalParticipantProfitAED.toLocaleString(
    "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  participantBody.push([
    "TOTAL ALLOCATED PROFIT",
    "",
    totalGramsSum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    `AED ${totalAllocatedProfitStr}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14, top: 24, bottom: 20 },
    tableWidth: 182,
    showHead: "everyPage",
    head: [["NAME", "PER G PROFIT", "GRAM", "PROFIT"]],
    body: participantBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      minCellHeight: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      valign: "middle",
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      minCellHeight: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 56, fontStyle: "bold" },
      1: { cellWidth: 38, halign: "right" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 50, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.row.index === participantBody.length - 1
      ) {
        hookData.cell.styles.fillColor = [241, 245, 249];
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.textColor = brandDark;
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 6;

  // 7. Reconciliation Note if difference exists
  if (Math.abs(report.unreconciledDifferenceAED) > 0.05) {
    ensurePageSpace(16);
    const diffStr = Math.abs(report.unreconciledDifferenceAED).toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, currentY, 182, 12, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Reconciliation Variance: Sum of participant profits (AED ${totalAllocatedProfitStr}) differs from After-Expense Balance (AED ${afterExpStr}) by AED ${diffStr}.`,
      18,
      currentY + 5
    );
    doc.text(
      report.unreconciledNote ||
        "Note: Participant allocations reflect contractual distribution on gross trading gap prior to deducting expenses.",
      18,
      currentY + 9
    );
  }

  // 8. Footer across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Hairline divider
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(14, 283, 196, 283);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("IVORA PLATFORM • CONFIDENTIAL FINANCIAL STATEMENT", 14, 288);
    doc.text(
      `As of ${report.asOfDateFormatted} — Page ${i} of ${totalPages}`,
      196,
      288,
      { align: "right" }
    );
  }

  // Trigger download
  const sanitizedBiz = (report.reference || report.businessName || "balance-sheet")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-balance-sheet-${sanitizedBiz}-${report.asOfDate}.pdf`);
}
