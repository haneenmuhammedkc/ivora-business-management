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

  // Theme Colors
  const brandDark = [15, 23, 42] as [number, number, number]; // Slate 900
  const textMuted = [100, 116, 139] as [number, number, number]; // Slate 500
  const bgLight = [248, 250, 252] as [number, number, number]; // Slate 50
  const borderLight = [226, 232, 240] as [number, number, number]; // Slate 200
  const highlightGreen = [240, 253, 244] as [number, number, number]; // Emerald 50
  const textGreen = [22, 101, 52] as [number, number, number]; // Emerald 800

  // 1. Top Header Banner (Full Page Width: 210mm)
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, 210, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("IVORA — BALANCE SHEET STATEMENT", 14, 11);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CLIENT-FORMAT SETTLEMENT & REALIZATION RECORD", 14, 16);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 16, { align: "right" });

  let currentY = 25;

  // 2. Section A: Business Heading (Dynamic Metadata Box)
  // Shared outer boundary: X = 14mm, width = 182mm (ends at 196mm)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 20, 2, 2, "FD");

  // Left column: Reference & Participant Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("BUSINESS / REFERENCE:", 18, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(report.reference || report.businessCode || "PAX-2", 60, currentY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("BUSINESS / PARTICIPANT:", 18, currentY + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(report.businessName || "PAX-ABI C OF SAMEER", 60, currentY + 14);

  // Right column: Date & Status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("DATE:", 140, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(report.asOfDateFormatted, 160, currentY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("CURRENCY:", 140, currentY + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("AED / INR", 160, currentY + 14);

  currentY += 24;

  // Helper for Section Titles
  const addSectionTitle = (title: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text(title.toUpperCase(), 14, yPos);
    return yPos + 3;
  };

  // 3. Section B: Purchase and Sale Summary Table
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
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["PARTICULARS", "GRM", "GRM RATE", "TOTAL (AED)", "RV RATE"]],
    body: tradingBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
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
  currentY = doc.lastAutoTable.finalY + 6;

  // 4. Section C: Expense Breakdown Table
  // PARTICULARS | INR | AED
  // Formats amounts cleanly with right-alignment and draws official vector Rupee glyph
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
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["PARTICULARS", "INR", "AED"]],
    body: expenseBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
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
  currentY = doc.lastAutoTable.finalY + 5;

  // 5. Section D: After-Expense Balance Callout Box
  // Shared boundary: X = 14mm, width = 182mm (ends at 196mm)
  const afterExpStr = report.afterExpBalanceAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  doc.setFillColor(highlightGreen[0], highlightGreen[1], highlightGreen[2]);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 12, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(textGreen[0], textGreen[1], textGreen[2]);
  doc.text("AFTER EXP BALANCE", 20, currentY + 7.5);

  doc.setFontSize(10.5);
  doc.text(`AED ${afterExpStr}`, 190, currentY + 7.5, { align: "right" });

  currentY += 16;

  // 6. Section E: Profit Allocation by Participant Table
  // Shared boundary: X = 14mm, width = 182mm (ends at 196mm)
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
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["NAME", "PER G PROFIT", "GRAM", "PROFIT"]],
    body: participantBody,
    theme: "grid",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2,
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
  currentY = doc.lastAutoTable.finalY + 4;

  // 7. Reconciliation Note if difference exists
  if (Math.abs(report.unreconciledDifferenceAED) > 0.05) {
    const diffStr = Math.abs(report.unreconciledDifferenceAED).toLocaleString(
      "en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, currentY, 182, 10, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Reconciliation Variance: Sum of participant profits (AED ${totalAllocatedProfitStr}) differs from After-Expense Balance (AED ${afterExpStr}) by AED ${diffStr}.`,
      17,
      currentY + 4
    );
    doc.text(
      report.unreconciledNote ||
        "Note: Participant allocations reflect contractual distribution on gross trading gap prior to deducting expenses.",
      17,
      currentY + 7.5
    );
  }

  // Trigger Save
  const sanitizedBiz = (report.reference || report.businessName || "balance-sheet")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-balance-sheet-${sanitizedBiz}-${report.asOfDate}.pdf`);
}
