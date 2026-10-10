import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvestorRecord } from "@/types/investors";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";

export interface InvestorExportOptions {
  generatedBy?: string;
}

export function exportInvestorToPdf(
  investor: InvestorRecord,
  settlement: InvestorSettlementOverview | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();
  const generatedDateFormatted = now
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
  const generatedTimeFormatted = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Authoritative financial and profile fields
  const pType = investor.participantType || settlement?.investor?.participantType || "INVESTOR";
  const totalInvestmentAED = settlement
    ? settlement.totalInvestmentAED
    : (investor.details?.totalInvestmentAED ?? investor.investmentAED);
  const sharePct = settlement ? settlement.contractualSharePct : (investor.sharePercent ?? 0);
  const allocatedProfitAED = settlement
    ? settlement.allocatedProfitAED
    : (investor.details?.allocatedProfit ?? 0);
  const totalDueAED = settlement ? settlement.totalDueAED : totalInvestmentAED + allocatedProfitAED;
  const totalPaidAED = settlement ? settlement.totalPaidAED : (investor.details?.paidAmount ?? 0);
  const capitalPaidAED = settlement ? settlement.totalCapitalPaidAED : 0;
  const profitPaidAED = settlement ? settlement.totalProfitPaidAED : 0;
  const outstandingAED = settlement
    ? settlement.totalOutstandingAED
    : (investor.details?.outstandingBalance ?? 0);
  const outstandingCapitalAED = settlement ? settlement.outstandingCapitalAED : 0;
  const outstandingProfitAED = settlement ? settlement.outstandingProfitAED : 0;
  const isSettled = settlement?.isFullySettled || investor.status === "SETTLED";
  const statusLabel = isSettled ? "SETTLED" : (investor.status || "ACTIVE");

  // Consistent color palette
  const brandDark = [12, 13, 18] as [number, number, number]; // #0c0d12
  const textMuted = [100, 116, 139] as [number, number, number]; // #64748b
  const textBody = [30, 41, 59] as [number, number, number]; // #1e293b
  const bgLight = [248, 250, 252] as [number, number, number]; // #f8fafc
  const borderLight = [226, 232, 240] as [number, number, number]; // #e2e8f0
  const emeraldDark = [4, 120, 87] as [number, number, number]; // #047857

  // Printable Area Dimensions
  const marginX = 14; // 14mm left/right margin
  const contentWidth = 182; // 210 - 28 = 182mm exactly

  // ==========================================
  // 1. TOP HEADER BANNER
  // ==========================================
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, 210, 22, "F");

  // Left Brand Wordmark & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("IVORA", marginX, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225); // #cbd5e1
  doc.text("BUSINESS MANAGEMENT PLATFORM", marginX, 15.5);

  // Right Metadata
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text("STATEMENT GENERATED", 210 - marginX, 9.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`${generatedDateFormatted} • ${generatedTimeFormatted}`, 210 - marginX, 15, {
    align: "right",
  });

  // ==========================================
  // 2. DOCUMENT TITLE & SUMMARY SUBTITLE
  // ==========================================
  let currentY = 30;

  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INVESTOR SETTLEMENT & PARTICIPATION STATEMENT", marginX, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    "Official financial position, capital allocations, and ledger of settlement disbursements.",
    marginX,
    currentY
  );

  currentY += 3.5;
  // Subtle top horizontal divider
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.25);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  currentY += 4;

  // ==========================================
  // 3. INVESTOR IDENTITY / METADATA SUMMARY GRID
  // ==========================================
  const identityRows = [
    [
      { content: "INVESTOR NAME\n" + investor.name, styles: { fontStyle: "bold" as const } },
      { content: "PARTICIPANT CODE\n" + (investor.code || "—"), styles: { fontStyle: "bold" as const } },
      { content: "EMAIL ADDRESS\n" + (investor.email || "—"), styles: { fontStyle: "normal" as const } },
      { content: "PHONE NUMBER\n" + (investor.phone || "—"), styles: { fontStyle: "normal" as const } },
    ],
    [
      { content: "ASSIGNED BUSINESS\n" + (investor.business || "Business Entity"), styles: { fontStyle: "bold" as const } },
      { content: "PARTICIPANT ROLE\n" + `${pType} Participant`, styles: { fontStyle: "bold" as const } },
      { content: "SETTLEMENT STATUS\n" + statusLabel, styles: { fontStyle: "bold" as const, textColor: isSettled ? emeraldDark : brandDark } },
      { content: "CURRENCY\n" + "AED (Dirham)", styles: { fontStyle: "normal" as const } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    body: identityRows,
    theme: "grid",
    styles: {
      fontSize: 7,
      textColor: textBody,
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
      lineColor: borderLight,
      lineWidth: 0.2,
      fillColor: bgLight,
    },
    columnStyles: {
      0: { cellWidth: 45.5 },
      1: { cellWidth: 45.5 },
      2: { cellWidth: 45.5 },
      3: { cellWidth: 45.5 },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // ==========================================
  // 4. FINANCIAL KPI SUMMARY (2 x 3 Balanced Grid)
  // ==========================================
  const kpiGridRows = [
    [
      {
        content:
          "TOTAL COMMITTED CAPITAL\n" +
          `AED ${totalInvestmentAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        content:
          "CONTRACTUAL PROFIT SHARE\n" +
          (sharePct !== null && sharePct !== undefined ? `${sharePct.toFixed(2)}%` : "—"),
      },
      {
        content:
          "ALLOCATED PROFIT\n" +
          `AED ${allocatedProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: { textColor: emeraldDark },
      },
    ],
    [
      {
        content:
          "TOTAL INVESTOR DUE\n" +
          `AED ${totalDueAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        content:
          "TOTAL PAID / DISBURSED\n" +
          `AED ${totalPaidAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: { textColor: emeraldDark },
      },
      {
        content:
          "TOTAL OUTSTANDING DUE\n" +
          `AED ${outstandingAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        styles: { textColor: outstandingAED > 0.01 ? ([180, 83, 9] as [number, number, number]) : brandDark },
      },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    body: kpiGridRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      fontStyle: "bold",
      textColor: brandDark,
      cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 },
      lineColor: borderLight,
      lineWidth: 0.25,
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 60.66 },
      1: { cellWidth: 60.66 },
      2: { cellWidth: 60.68 },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ==========================================
  // 5. SECTION 01: PARTICIPANT & CAPITAL CONTRACT DETAILS
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("01  PARTICIPANT & CAPITAL CONTRACT DETAILS", marginX, currentY);

  currentY += 3;

  const detailRows = [
    ["Investor Legal Name", investor.name, "Participant Role", `${pType} Participant`],
    ["Investor Code", investor.code || "—", "Contractual Profit Share", `${sharePct}%`],
    ["Email Address", investor.email || "—", "Investment Date", investor.date || "—"],
    ["Phone Number", investor.phone || "—", "Assigned Business", investor.business || "—"],
    [
      "Committed Capital",
      `AED ${totalInvestmentAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Settlement Status",
      statusLabel,
    ],
    [
      "Capital Paid / Returned",
      `AED ${capitalPaidAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Outstanding Capital Due",
      `AED ${outstandingCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "Profit Paid / Disbursed",
      `AED ${profitPaidAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Outstanding Profit Due",
      `AED ${outstandingProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [["PROPERTY", "VALUE", "PROPERTY", "VALUE"]],
    body: detailRows,
    theme: "striped",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: "bold",
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    styles: {
      fontSize: 7,
      textColor: textBody,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      lineColor: borderLight,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 43, fillColor: bgLight },
      1: { cellWidth: 48 },
      2: { fontStyle: "bold", cellWidth: 43, fillColor: bgLight },
      3: { cellWidth: 48 },
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ==========================================
  // 6. SECTION 02: SETTLEMENT DISBURSAL HISTORY
  // ==========================================
  const paymentHistory = settlement?.paymentHistory || [];

  // Multi-page protection: if not enough space for heading + first row, break page cleanly
  if (currentY > 235 && paymentHistory.length > 0) {
    doc.addPage();
    currentY = 22;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("02  SETTLEMENT DISBURSAL HISTORY", marginX, currentY);

  currentY += 3;

  if (paymentHistory.length === 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [
        [
          "PAYMENT DATE",
          "TRANSACTION REFERENCE",
          "PAYMENT METHOD",
          "CAPITAL RETURNED",
          "PROFIT DISBURSED",
          "TOTAL DISBURSED",
          "STATUS",
        ],
      ],
      body: [["—", "No settlement disbursal transactions recorded to date.", "—", "—", "—", "—", "PENDING"]],
      theme: "plain",
      headStyles: {
        fillColor: brandDark,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: "bold",
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
      styles: {
        fontSize: 7,
        textColor: textMuted,
        halign: "center",
        cellPadding: { top: 3, bottom: 3 },
        lineColor: borderLight,
        lineWidth: 0.2,
        fillColor: bgLight,
      },
    });
  } else {
    const historyRows = paymentHistory.map((item) => [
      item.date,
      item.paymentReference || "—",
      item.paymentMethod,
      `AED ${item.capitalReturned.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${item.profitDisbursed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${item.totalPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `[ ${item.status || "CLEARED"} ]`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      showHead: "everyPage",
      head: [
        [
          "PAYMENT DATE",
          "TRANSACTION REFERENCE",
          "PAYMENT METHOD",
          "CAPITAL RETURNED",
          "PROFIT DISBURSED",
          "TOTAL DISBURSED",
          "STATUS",
        ],
      ],
      body: historyRows,
      theme: "striped",
      headStyles: {
        fillColor: brandDark,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: "bold",
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      },
      styles: {
        fontSize: 7,
        textColor: textBody,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        lineColor: borderLight,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 22, halign: "left" },
        1: { cellWidth: 42, fontStyle: "bold", halign: "left" },
        2: { cellWidth: 30, halign: "left" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 16, halign: "center", fontStyle: "bold", textColor: emeraldDark },
      },
    });
  }

  // ==========================================
  // 7. FOOTER ON EVERY PAGE (Multi-Page Ready)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle footer divider
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, 285, 210 - marginX, 285);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text(
      "IVORA BUSINESS MANAGEMENT PLATFORM • CONFIDENTIAL INVESTOR SETTLEMENT RECORD",
      marginX,
      289.5
    );

    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Page ${i} of ${totalPages}`, 210 - marginX, 289.5, { align: "right" });
  }

  // ==========================================
  // 8. TRIGGER DOWNLOAD
  // ==========================================
  const sanitizedName = (investor.name || "investor").toLowerCase().replace(/[^a-z0-9]/g, "_");
  const sanitizedCode = (investor.code || "inv").toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-investor-${sanitizedName}-${sanitizedCode}-statement.pdf`);
}
