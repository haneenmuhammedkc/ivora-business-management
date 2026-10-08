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
  doc.text("BUSINESS MANAGEMENT & PHYSICAL BULLION PLATFORM", 14, 19);

  doc.setFontSize(8);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 19, { align: "right" });

  // Report Title & Metadata Box
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TRANSACTION-BASED FINANCIAL POSITION STATEMENT", 14, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Entity Scope: ${businessName}`, 14, 41);
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
        "COMMITTED CAPITAL",
        "INVENTORY VALUE",
        "REALIZED SALES",
        "OPERATING PROFIT",
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

  // 2. Capital Position Pool
  currentY = addSectionHeader("1. Capital Position Pool", currentY);
  const capitalRows = data.capital.breakdown.map((item) => [
    item.name,
    item.note || item.drilldown || "",
    `AED ${item.amountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Category / Partner Component", "Description & Allocation", "Committed Amount (AED)"]],
    body: capitalRows,
    theme: "striped",
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 60, textColor: textMuted },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // 3. Physical Bullion Inventory Valuation
  currentY = addSectionHeader("2. Physical Bullion Inventory Position", currentY);
  const inventoryRows = data.inventory.items.map((item) => [
    `${item.businessName} — ${item.productType.replace(/_/g, " ")}`,
    `${item.remainingQuantity.toLocaleString("en-US", { maximumFractionDigits: 2 })} gms`,
    `AED ${item.averageCostPerUnitAED.toFixed(2)}/g`,
    `AED ${item.carryingValueAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  inventoryRows.push([
    "Consolidated Physical Inventory Total",
    `${data.inventory.totalStockGrams.toLocaleString("en-US", { maximumFractionDigits: 2 })} gms`,
    `AED ${data.inventory.averageCostPerGramAED.toFixed(2)}/g (avg)`,
    `AED ${data.inventory.totalCarryingValueAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Inventory Item & Entity", "Remaining Quantity", "Avg Cost / Gram", "Carrying Value (AED)"]],
    body: inventoryRows,
    theme: "striped",
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 38, halign: "right" },
      2: { cellWidth: 34, halign: "right" },
      3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
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

  // 4. Cumulative Trading Position
  currentY = addSectionHeader("3. Cumulative Trading Position & Spread", currentY);
  const tradingRows = data.trading.breakdown.map((item) => [
    item.name,
    item.note || item.drilldown || "",
    `AED ${item.amountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Trading Position Metric", "Details & Volume", "Amount (AED)"]],
    body: tradingRows,
    theme: "striped",
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 60, textColor: textMuted },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // @ts-expect-error jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Partner Settlement Position
  currentY = addSectionHeader("4. Partner Settlement Position", currentY);
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
    head: [["Entity & Partner Share", "Entitlement (AED)", "Disbursed (AED)", "Pending Disbursal (AED)"]],
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

  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Business Position Table
  currentY = addSectionHeader("5. Entity Performance & Position Breakdown", currentY);
  const bizRows = data.businesses.map((b) => [
    b.business,
    `AED ${b.committedCapitalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    `${b.stockGrams.toLocaleString("en-US", { maximumFractionDigits: 1 })}g`,
    `AED ${b.salesAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    `AED ${b.operatingProfitAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    `AED ${b.pendingDisbursalAED.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Entity", "Capital", "Stock", "Sales", "Op. Profit", "Pending Disb."]],
    body: bizRows,
    theme: "striped",
    headStyles: { fillColor: brandDark, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: "bold" },
      1: { cellWidth: 28, halign: "right" },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.2,
  });

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Ivora Financial Position Statement — As of ${asOfDate} — Page ${i} of ${totalPages}`,
      105,
      290,
      { align: "center" }
    );
  }

  // Trigger download
  const sanitizedBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`ivora-financial-position-${sanitizedBiz}-${asOfDate}.pdf`);
}
