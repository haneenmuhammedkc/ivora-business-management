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

  const businessName = options.businessName || data.businessScope || "Consolidated Portfolio";
  const asOfDate = options.asOfDate || data.asOfDate || new Date().toISOString().split("T")[0];
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Primary brand colors
  const brandDark = [12, 13, 18] as [number, number, number]; // #0c0d12
  const textMuted = [100, 116, 139] as [number, number, number]; // #64748b
  const bgLight = [248, 250, 252] as [number, number, number]; // #f8fafc
  const borderLight = [226, 232, 240] as [number, number, number];

  // Header Banner
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, 210, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IVORA", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("BUSINESS MANAGEMENT PLATFORM", 14, 19);

  doc.setFontSize(8);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 19, { align: "right" });

  // Report Title & Metadata Box
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("BALANCE SHEET", 14, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Financial Position & Holdings — Scope: ${businessName}`, 14, 41);
  doc.text(`As of Date: ${asOfDate}`, 14, 46);
  if (options.statusLabel && options.statusLabel !== "All Status") {
    doc.text(`Status Filter: ${options.statusLabel}`, 120, 41);
  }
  if (options.productLabel && options.productLabel !== "All Products") {
    doc.text(`Product Type: ${options.productLabel}`, 120, 46);
  }
  doc.text("Currency: AED (United Arab Emirates Dirham)", 14, 51);

  let currentY = 56;

  // 1. KPI Summary Table
  const kpis = data.kpis;
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "TOTAL INVESTED CAPITAL",
        "INVENTORY ON HAND",
        "SALES",
        "NET PROFIT",
        "PARTNER BALANCE",
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
      fillColor: bgLight,
      textColor: textMuted,
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      fontStyle: "bold",
      textColor: brandDark,
      halign: "center",
      cellPadding: 4,
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // Helper for Section Titles
  const addSectionHeader = (title: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text(title, 14, yPos);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 2, 196, yPos + 2);
    return yPos + 6;
  };

  // 2. Section 1: Investment & Inventory
  currentY = addSectionHeader("1. Investment & Inventory", currentY);
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
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 60, textColor: textMuted },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (dataCell) => {
      const rawRow = dataCell.row.raw as unknown as (string | number)[];
      const rowText = String(rawRow?.[0] || "");
      if (rowText.startsWith("Total Invested") || rowText.startsWith("Inventory on Hand")) {
        dataCell.cell.styles.fontStyle = "bold";
      }
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // 3. Section 2: Sales, Costs & Profit
  currentY = addSectionHeader("2. Sales, Costs & Profit", currentY);
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
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 60, textColor: textMuted },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
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
  currentY = doc.lastAutoTable.finalY + 8;

  // Check page break for next sections
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // 4. Partner Settlement
  currentY = addSectionHeader("3. Partner Settlement", currentY);
  const settlementRows = data.settlement.partners.map((p) => [
    `${p.businessName} (${p.partnerName})`,
    `AED ${p.entitlementAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `AED ${p.disbursedAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `AED ${p.pendingAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  settlementRows.push([
    "Consolidated Partner Settlement Total",
    `AED ${data.settlement.totalPartnerEntitlementAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `AED ${data.settlement.profitDisbursedAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `AED ${data.settlement.pendingPartnerDisbursalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Business & Partner Share", "Entitlement (AED)", "Paid Disbursals (AED)", "Pending Disbursal (AED)"]],
    body: settlementRows,
    theme: "striped",
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: "bold" },
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // 5. Business Breakdown
  if (data.businesses && data.businesses.length > 0) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionHeader("4. Business Breakdown", currentY);
    const bizRows = data.businesses.map((b) => [
      b.business,
      `AED ${b.committedCapitalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.inventoryValueAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.salesAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.purchaseAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.expensesAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.operatingProfitAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      `AED ${b.pendingDisbursalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Business", "Invested Cap", "Inventory", "Sales", "Purchase Cost", "Expenses", "Net Profit", "Pending"]],
      body: bizRows,
      theme: "striped",
      headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: "bold" },
        1: { cellWidth: 22, halign: "right" },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 22, halign: "right", fontStyle: "bold" },
        7: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (dataCell) => {
        const rawRow = dataCell.row.raw as unknown as (string | number)[];
        if (String(rawRow?.[0] || "").includes("Consolidated")) {
          dataCell.cell.styles.fontStyle = "bold";
          dataCell.cell.styles.fillColor = [241, 245, 249];
        }
      },
      tableLineColor: borderLight,
      tableLineWidth: 0.2,
    });
  }

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Ivora Balance Sheet — As of ${asOfDate} — Page ${i} of ${totalPages}`,
      105,
      290,
      { align: "center" }
    );
  }

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-balance-sheet-${sanitizedBiz}-${asOfDate}.pdf`);
}
