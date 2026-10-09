import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportsOverviewResponse, DetailedReportResponse } from "@/types/reports";

export interface ReportExportOptions {
  businessName?: string;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
}

const BRAND_DARK: [number, number, number] = [12, 13, 18]; // #0c0d12
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // #64748b
const BG_LIGHT: [number, number, number] = [248, 250, 252]; // #f8fafc
const BORDER_LIGHT: [number, number, number] = [226, 232, 240];

function renderBanner(doc: jsPDF, title: string, subtitle: string, generatedAt: string) {
  doc.setFillColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.rect(0, 0, 210, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IVORA", 14, 12);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("BUSINESS MANAGEMENT & INSTITUTIONAL REPORTING PLATFORM", 14, 19);

  doc.setFontSize(8);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, 196, 19, { align: "right" });
}

function renderFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
    doc.line(14, 285, 196, 285);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("IVORA DIFC COMPLIANT AUDITED REPORT • CONFIDENTIAL", 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }
}

/**
 * Export Consolidated Reports Overview to PDF
 */
export function exportReportsOverviewPdf(
  data: ReportsOverviewResponse,
  options: ReportExportOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const businessName = options.businessName || "Consolidated Portfolio (All Entities)";
  const period = options.periodLabel || "This Month";
  const dateRange =
    options.startDate && options.endDate
      ? `${options.startDate} to ${options.endDate}`
      : period;
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  renderBanner(doc, "IVORA", "INSTITUTIONAL REPORT", generatedAt);

  // Metadata Box
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CONSOLIDATED INSTITUTIONAL EXECUTIVE REPORT", 14, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(`Entity Scope: ${businessName}`, 14, 41);
  doc.text(`Period / Range: ${dateRange}`, 14, 46);
  doc.text("Currency: AED (United Arab Emirates Dirham)", 120, 41);
  doc.text("Standard: DIFC / IFRS-9 Dual-Currency Ledger", 120, 46);

  // KPI Strip
  let currentY = 52;
  doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
  doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
  doc.roundedRect(14, currentY, 182, 18, 2, 2, "FD");

  const kpis = [
    { label: "TOTAL SALES", val: `AED ${data.kpis.totalSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "PURCHASE COST", val: `AED ${data.kpis.totalPurchaseAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "EXPENSES", val: `AED ${data.kpis.totalExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "NET PROFIT", val: `AED ${data.kpis.netProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "INVESTOR POOL", val: `AED ${data.kpis.investorShareAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  ];

  const colWidth = 182 / 5;
  kpis.forEach((k, i) => {
    const x = 14 + i * colWidth + 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(k.label, x, currentY + 6);

    doc.setFontSize(7.5);
    doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
    doc.text(k.val, x, currentY + 13);
  });

  currentY += 24;

  // Section 1: Business Comparison Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.text("1. Entity Performance Comparison", 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Entity Name", "Code", "Sales (AED)", "Purchases (AED)", "Expenses (AED)", "Net Profit (AED)", "Margin %", "Status"]],
    body: data.quickDesk.business.map((b) => [
      b.name,
      b.code,
      b.totalSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      b.totalPurchasesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      b.totalExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      b.netProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${b.marginPct.toFixed(2)}%`,
      b.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: BRAND_DARK, textColor: 255, fontSize: 7.5, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 2: Expense Analysis Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.text("2. Itemized Expense Breakdown by Category", 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Expense Category", "Transaction Count", "Total Amount (AED)", "Share of Total %"]],
    body: data.quickDesk.expense.map((e) => [
      e.category,
      String(e.count),
      e.totalAmountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${e.percentageOfTotal.toFixed(2)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: BRAND_DARK, textColor: 255, fontSize: 7.5, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 3: Investor Capital & Yield Summary
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.text("3. Investor Capital Commitments & Entitlements", 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Investor Name", "Code", "Entity", "Type", "Committed Capital (AED)", "Profit Share %", "Est. Profit (AED)", "Status"]],
    body: data.quickDesk.investor.map((inv) => [
      inv.name,
      inv.code,
      inv.businessName,
      inv.type,
      inv.committedCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${inv.profitSharePct.toFixed(2)}%`,
      inv.estimatedProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      inv.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: BRAND_DARK, textColor: 255, fontSize: 7.5, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  renderFooters(doc);

  const safeFilename = `ivora-executive-report-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(safeFilename);
}

/**
 * Export Detailed Report to PDF
 */
export function exportDetailedReportPdf(data: DetailedReportResponse) {
  const doc = new jsPDF({
    orientation: data.columns.length > 7 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = data.columns.length > 7 ? 297 : 210;
  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Banner
  doc.setFillColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IVORA", 14, 12);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("INSTITUTIONAL AUDIT & TRANSACTION STATEMENT", 14, 19);

  doc.setFontSize(8);
  doc.text(`GENERATED: ${generatedAt.toUpperCase()}`, pageWidth - 14, 19, { align: "right" });

  // Metadata
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.title.toUpperCase(), 14, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(data.subtitle, 14, 40);

  doc.text(`Entity Scope: ${data.entityScope}`, 14, 46);
  doc.text(`Period / Range: ${data.dateRange}`, 14, 51);

  // Metrics Summary
  let currentY = 56;
  if (data.summaryMetrics.length > 0) {
    const cardWidth = (pageWidth - 28) / data.summaryMetrics.length;
    data.summaryMetrics.forEach((m, idx) => {
      const x = 14 + idx * cardWidth;
      doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
      doc.roundedRect(x, currentY, cardWidth - 2, 12, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text(m.label.toUpperCase(), x + 3, currentY + 4.5);

      doc.setFontSize(7.5);
      doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
      doc.text(m.currency ? `${m.currency} ${m.value}` : m.value, x + 3, currentY + 9.5);
    });
    currentY += 17;
  }

  // Table
  const head = [data.columns.map((c) => c.label)];
  const body = data.rows.map((row) => data.columns.map((col) => String(row[col.key] ?? "-")));

  const columnStyles: Record<number, { halign: "left" | "right" | "center" }> = {};
  data.columns.forEach((c, i) => {
    if (c.align) {
      columnStyles[i] = { halign: c.align };
    }
  });

  autoTable(doc, {
    startY: currentY,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: BRAND_DARK, textColor: 255, fontSize: 7.5, fontStyle: "bold" },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles,
    margin: { left: 14, right: 14 },
  });

  // Footers
  const pageCount = doc.getNumberOfPages();
  const pageHeight = data.columns.length > 7 ? 210 : 297;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("IVORA DIFC AUDITED TRANSACTION LEDGER • CONFIDENTIAL", 14, pageHeight - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
  }

  const safeFilename = `ivora-${data.reportType}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(safeFilename);
}
