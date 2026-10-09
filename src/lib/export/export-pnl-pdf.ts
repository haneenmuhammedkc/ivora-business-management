import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ProfitLossResponseData } from "@/types/profit-loss";

export interface PnlExportOptions {
  businessName?: string;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  statusLabel?: string;
  productLabel?: string;
}

export function exportProfitLossToPdf(
  data: ProfitLossResponseData,
  options: PnlExportOptions = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const businessName = options.businessName || "Consolidated (All Businesses)";
  const period = options.periodLabel || "This Month";
  const dateRange =
    options.startDate && options.endDate
      ? `${options.startDate} to ${options.endDate}`
      : period;
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
  doc.text("PROFIT & LOSS STATEMENT", 14, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Entity Scope: ${businessName}`, 14, 42);
  doc.text(`Period: ${dateRange}`, 14, 47);
  if (options.statusLabel && options.statusLabel !== "All Status") {
    doc.text(`Status Filter: ${options.statusLabel}`, 120, 42);
  }
  if (options.productLabel && options.productLabel !== "All Products") {
    doc.text(`Product Type: ${options.productLabel}`, 120, 47);
  }
  doc.text("Currency: AED (United Arab Emirates Dirham)", 14, 52);

  let currentY = 57;

  // 1. KPI Summary Table
  const kpis = data.kpis;
  autoTable(doc, {
    startY: currentY,
    head: [["TOTAL SALES", "PURCHASE COST", "OPERATING EXPENSES", "GROSS PROFIT", "NET PROFIT"]],
    body: [
      [
        `AED ${kpis.totalSalesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.purchaseCostAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.totalExpensesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.grossProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `AED ${kpis.netProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: bgLight,
      textColor: textMuted,
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: brandDark,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
    },
    tableLineColor: borderLight,
    tableLineWidth: 0.1,
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // 2. Profit & Loss Statement Detailed Table
  const stmt = data.statement;
  const statementRows: (string | number)[][] = [];

  const formatRevenueTitle = (title: string) => {
    if (title.includes("India Sales") || title.includes("Realization Protocol") || title.includes("Sales Transactions")) {
      return "Sales";
    }
    return title;
  };

  const formatPurchaseTitle = (title: string) => {
    if (title.includes("Dubai Physical Bullion") || title.includes("Fine Sourcing") || title.includes("Purchase Transactions")) {
      return "Purchase Cost";
    }
    return title;
  };

  // Revenue
  statementRows.push(["1. REVENUE (TOTAL SALES)", ""]);
  for (const item of stmt.tradingRevenue) {
    statementRows.push([`   ${formatRevenueTitle(item.title)}`, `AED ${item.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
  }
  statementRows.push(["   TOTAL SALES", `AED ${stmt.totalRevenueAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);

  // Purchases
  statementRows.push(["2. LESS: PURCHASE COST", ""]);
  for (const item of stmt.costOfBullion) {
    statementRows.push([`   ${formatPurchaseTitle(item.title)}`, `AED ${item.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
  }
  statementRows.push(["   PURCHASE COST", `AED ${stmt.totalPurchaseCostAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);

  // Gross Profit
  statementRows.push([
    `GROSS PROFIT (GROSS MARGIN: ${stmt.grossSpreadMarginPercent.toFixed(2)}%)`,
    `AED ${stmt.grossProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  // Expenses
  statementRows.push(["3. LESS: OPERATING EXPENSES", ""]);
  for (const exp of stmt.operatingExpenses) {
    statementRows.push([`   ${exp.title}`, `AED ${exp.amountAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
  }
  statementRows.push(["   OPERATING EXPENSES", `AED ${stmt.totalExpensesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);

  // Net Profit
  statementRows.push([
    `NET PROFIT (NET MARGIN: ${stmt.netMarginPercent.toFixed(2)}%)`,
    `AED ${(stmt.netProfitAED ?? stmt.auditedNetProfitAED ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["P&L LINE ITEM", "AMOUNT (AED)"]],
    body: statementRows,
    theme: "striped",
    headStyles: {
      fillColor: brandDark,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 135, fontSize: 8 },
      1: { cellWidth: 47, halign: "right", fontStyle: "bold", fontSize: 8 },
    },
    didParseCell: (dataCell) => {
      const rawRow = dataCell.row.raw as unknown as (string | number)[];
      const rowText = String(rawRow?.[0] || "");
      if (
        rowText.startsWith("1.") ||
        rowText.startsWith("2.") ||
        rowText.startsWith("3.")
      ) {
        dataCell.cell.styles.fontStyle = "bold";
        dataCell.cell.styles.fillColor = [241, 245, 249];
      }
      if (rowText.startsWith("GROSS PROFIT")) {
        dataCell.cell.styles.fontStyle = "bold";
        dataCell.cell.styles.fillColor = [237, 244, 248];
      }
      if (rowText.startsWith("NET PROFIT")) {
        dataCell.cell.styles.fontStyle = "bold";
        dataCell.cell.styles.fillColor = [12, 13, 18];
        dataCell.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // 3. Business Profitability Table (if on same page or add page)
  if (data.businesses && data.businesses.length > 0) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text("BUSINESS PROFITABILITY COMPARISON", 14, currentY);
    currentY += 4;

    const bizRows = data.businesses.map((b) => [
      b.name,
      `AED ${b.salesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${b.purchaseAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${b.expensesAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${b.grossProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `AED ${b.netProfitAED.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${b.netMarginPercent.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["BUSINESS", "TOTAL SALES", "PURCHASE COST", "OPERATING EXPENSES", "GROSS PROFIT", "NET PROFIT", "MARGIN"]],
      body: bizRows,
      theme: "grid",
      headStyles: {
        fillColor: brandDark,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: brandDark,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { halign: "right", cellWidth: 24 },
        2: { halign: "right", cellWidth: 24 },
        3: { halign: "right", cellWidth: 24 },
        4: { halign: "right", cellWidth: 24 },
        5: { halign: "right", cellWidth: 24, fontStyle: "bold" },
        6: { halign: "center", cellWidth: 20 },
      },
      didParseCell: (dataCell) => {
        const rawRow = dataCell.row.raw as unknown as (string | number)[];
        if (String(rawRow?.[0] || "").includes("CONSOLIDATED")) {
          dataCell.cell.styles.fontStyle = "bold";
          dataCell.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Ivora Business Management Platform  |  Confidential  |  Page ${i} of ${totalPages}`,
      105,
      290,
      { align: "center" }
    );
  }

  const safeBizSlug = businessName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const filename = `Ivora-Profit-Loss-${safeBizSlug}-${Date.now()}.pdf`;
  doc.save(filename);
}
