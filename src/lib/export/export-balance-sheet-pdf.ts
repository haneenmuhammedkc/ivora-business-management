import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BalanceSheetResponseData } from "@/types/balance-sheet";

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
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const businessName =
    options.businessName || data.businessScope || "Consolidated Portfolio";
  const asOfDate =
    options.asOfDate || data.asOfDate || new Date().toISOString().split("T")[0];
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Primary brand palette
  const brandDark = [12, 13, 18] as [number, number, number]; // #0c0d12
  const textMuted = [100, 116, 139] as [number, number, number]; // #64748b
  const bgLight = [248, 250, 252] as [number, number, number]; // #f8fafc
  const borderLight = [226, 232, 240] as [number, number, number]; // #e2e8f0

  // 1. Header Banner (28mm height)
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, 210, 28, "F");

  // Left branding
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("IVORA", 14, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("BUSINESS MANAGEMENT PLATFORM", 14, 20);

  // Right statement descriptor + timestamp
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("STATEMENT OF FINANCIAL POSITION", 196, 13, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 20, { align: "right" });

  // 2. Report Title & Subtitle
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("BALANCE SHEET", 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Financial Position, Asset Allocations & Settlement Ledger", 14, 43.5);

  // 3. Structured Metadata Card (18mm height)
  const metaBoxY = 47.5;
  const metaBoxHeight = 18;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, metaBoxY, 182, metaBoxHeight, 1.5, 1.5, "FD");

  // Col 1: Scope / Entity
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("ENTITY / SCOPE", 18, metaBoxY + 5.5);
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  const truncatedBiz =
    businessName.length > 36 ? `${businessName.slice(0, 34)}...` : businessName;
  doc.text(truncatedBiz, 18, metaBoxY + 12);

  // Col 2: As of Date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("AS OF DATE", 82, metaBoxY + 5.5);
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(asOfDate, 82, metaBoxY + 12);

  // Col 3: Currency
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("CURRENCY", 122, metaBoxY + 5.5);
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("AED (Dirhams)", 122, metaBoxY + 12);

  // Col 4: Active Filters
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("ACTIVE FILTERS", 158, metaBoxY + 5.5);
  doc.setFontSize(7.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  const statusStr =
    options.statusLabel && options.statusLabel !== "all"
      ? options.statusLabel
      : "All Status";
  const productStr =
    options.productLabel && options.productLabel !== "all"
      ? options.productLabel
      : "All Products";
  doc.text(`${statusStr} • ${productStr}`, 158, metaBoxY + 12);

  let currentY = metaBoxY + metaBoxHeight + 6;

  // 4. KPI Summary Table
  const kpis = data.kpis;
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "TOTAL INVESTED CAPITAL",
        "INVENTORY ON HAND",
        "SALES",
        "NET PROFIT",
        "PENDING DISBURSAL",
      ],
    ],
    body: [
      [
        `AED ${kpis.totalCommittedCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.inventoryCarryingValueAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.totalRealizedSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.netOperatingProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.pendingPartnerDisbursalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [71, 85, 105],
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      cellPadding: { top: 3.5, bottom: 2, left: 2, right: 2 },
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      textColor: brandDark,
      halign: "center",
      cellPadding: { top: 2.5, bottom: 4.5, left: 2, right: 2 },
      minCellHeight: 12,
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.3,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 9;

  // Section Header Helper
  const addSectionHeader = (title: string, yPos: number, subtitle?: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text(title, 14, yPos);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(subtitle, 196, yPos, { align: "right" });
    }

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 2.5, 196, yPos + 2.5);

    doc.setDrawColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.setLineWidth(1.0);
    doc.line(14, yPos + 2.5, 34, yPos + 2.5);

    return yPos + 6.5;
  };

  // 5. Section 1: Investment & Inventory
  currentY = addSectionHeader("1. Investment & Inventory", currentY, "Committed Capital & Vault Valuation");
  const capitalRows: (string | number)[][] = [
    [
      "Admin Capital",
      `${data.capital.adminSharePercent.toFixed(1)}% of capital pool`,
      `AED ${data.capital.adminCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "Partner Capital",
      `${data.capital.partnerSharePercent.toFixed(1)}% of capital pool`,
      `AED ${data.capital.partnerCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "Total Invested Capital",
      "100.0% of capital pool",
      `AED ${data.capital.totalCommittedCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      `Inventory on Hand (${data.inventory.totalStockGrams.toLocaleString("en-US", { maximumFractionDigits: 1 })} gms in stock)`,
      `Avg cost: AED ${data.inventory.averageCostPerGramAED.toFixed(2)} / g`,
      `AED ${data.inventory.totalCarryingValueAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Category / Asset Component", "Allocation & Notes", "Amount (AED)"]],
    body: capitalRows,
    theme: "striped",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      minCellHeight: 8,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 58, textColor: textMuted },
      2: { cellWidth: 44, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (dataCell) => {
      const rawRow = dataCell.row.raw as unknown as (string | number)[];
      const rowText = String(rawRow?.[0] || "");
      if (rowText.startsWith("Total Invested") || rowText.startsWith("Inventory on Hand")) {
        dataCell.cell.styles.fontStyle = "bold";
        dataCell.cell.styles.fillColor = [241, 245, 249];
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 9;

  // 6. Section 2: Sales, Costs & Profit
  currentY = addSectionHeader("2. Sales, Costs & Profit", currentY, "Realized Trading Performance");
  const tradingRows = [
    [
      "Sales",
      "Cumulative sales revenue recognized",
      `AED ${data.trading.realizedSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "Purchase Cost",
      "Cumulative inventory purchases at landed cost",
      `-AED ${data.trading.purchaseSourcingCostAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      "Operating Expenses",
      "Cumulative operational expenses",
      `-AED ${data.trading.operatingExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
    [
      `Net Profit (Net Margin: ${data.trading.operatingMarginPercent.toFixed(2)}%)`,
      "Sales - Purchase Cost - Operating Expenses",
      `AED ${data.trading.operatingProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Financial Line Item", "Description", "Amount (AED)"]],
    body: tradingRows,
    theme: "striped",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      minCellHeight: 8,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 58, textColor: textMuted },
      2: { cellWidth: 44, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (dataCell) => {
      const rawRow = dataCell.row.raw as unknown as (string | number)[];
      const rowText = String(rawRow?.[0] || "");
      if (rowText.startsWith("Net Profit")) {
        dataCell.cell.styles.fontStyle = "bold";
        dataCell.cell.styles.fillColor = [241, 245, 249];
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 9;

  // 7. Section 3: Settlement Breakdown
  const settlementItems = data.settlementBreakdown || [];
  if (settlementItems.length > 0) {
    // Check if section + rows will fit on page 1 without awkward clipping
    const estimatedHeight = 8 + 8 + settlementItems.length * 11;
    const pageBreakThreshold = 276;
    if (currentY + estimatedHeight > pageBreakThreshold) {
      doc.addPage();
      currentY = 22;
    }

    currentY = addSectionHeader("3. Settlement Breakdown", currentY, "Participant Positions & Disbursal Status");
    const settlementRows = settlementItems.map((s) => [
      s.businessName,
      s.investorName,
      s.allocatedGrams && s.allocatedGrams > 0
        ? `AED ${s.totalInvestmentAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}\n(${s.allocatedGrams.toLocaleString("en-US", { maximumFractionDigits: 2 })}g)`
        : `AED ${s.totalInvestmentAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      s.perGramProfitAED && s.perGramProfitAED > 0
        ? `AED ${s.profitAmountAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}\n(@AED ${s.perGramProfitAED.toFixed(2)}/g)`
        : `AED ${s.profitAmountAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${s.totalDueAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${s.totalPaidAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${s.pendingOutstandingAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      s.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: currentY,
      showHead: "everyPage",
      head: [
        [
          "Business",
          "Investor",
          "Investment",
          "Profit Alloc.",
          "Total Due",
          "Paid / Disbursed",
          "Outstanding",
          "Status",
        ],
      ],
      body: settlementRows,
      theme: "striped",
      headStyles: {
        fillColor: brandDark,
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: "bold",
        cellPadding: { top: 3.2, bottom: 3.2, left: 1.5, right: 1.5 },
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [30, 41, 59],
        cellPadding: { top: 2.8, bottom: 2.8, left: 1.5, right: 1.5 },
        minCellHeight: 9.5,
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { cellWidth: 32, fontStyle: "bold" },
        2: { cellWidth: 21, halign: "right" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 21, halign: "right", fontStyle: "bold" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
        7: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      },
      didParseCell: (dataCell) => {
        if (dataCell.column.index === 7) {
          const statusText = String(dataCell.cell.raw || "");
          if (statusText === "SETTLED") {
            dataCell.cell.styles.textColor = [4, 120, 87]; // emerald-700
          } else if (statusText === "PARTIALLY SETTLED") {
            dataCell.cell.styles.textColor = [29, 78, 216]; // blue-700
          } else {
            dataCell.cell.styles.textColor = [180, 83, 9]; // amber-700
          }
        }
      },
      tableLineColor: borderLight,
      tableLineWidth: 0.2,
    });
  }

  // 8. Footers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Hairline divider
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(14, 283, 196, 283);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("IVORA PLATFORM • CONFIDENTIAL FINANCIAL STATEMENT", 14, 288);
    doc.text(
      `As of ${asOfDate} — Page ${i} of ${totalPages}`,
      196,
      288,
      { align: "right" }
    );
  }

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-balance-sheet-${sanitizedBiz}-${asOfDate}.pdf`);
}
