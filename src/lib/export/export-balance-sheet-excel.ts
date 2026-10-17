import ExcelJS from "exceljs";
import { BalanceSheetResponseData } from "@/types/balance-sheet";
import { BalanceSheetExportOptions } from "./export-balance-sheet-pdf";
import { getClientBalanceSheetReportData } from "./balance-sheet-client-adapter";

type CellValue = string | number | null | undefined;

const COLORS = {
  navy: "FF101A2D",
  white: "FFFFFFFF",
  black: "FF111827",
  border: "FFB8BEC7",
  paleYellow: "FFFFF2CC",
  paleGreen: "FFE2EFDA",
  paleBlue: "FFD9E1F2",
  note: "FFF3F6FA",
  greenText: "FF087443",
};

const NUMBER_FORMATS = {
  integer: "#,##0;[Red]-#,##0;–",
  decimal2: "#,##0.00;[Red]-#,##0.00;–",
  decimal4: "#,##0.0000;[Red]-#,##0.0000;–",
};

function isNumber(value: CellValue): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function applyThinBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } },
  };
}

function styleCell(
  cell: ExcelJS.Cell,
  options: {
    bold?: boolean;
    italic?: boolean;
    align?: "left" | "center" | "right";
    fill?: string;
    fontColor?: string;
    fontSize?: number;
    numberFormat?: string;
    border?: boolean;
    wrapText?: boolean;
  } = {},
): void {
  cell.font = {
    name: "Calibri",
    size: options.fontSize ?? 10,
    bold: options.bold ?? false,
    italic: options.italic ?? false,
    color: { argb: options.fontColor ?? COLORS.black },
  };
  cell.alignment = {
  horizontal: options.align ?? "center",
  vertical: "middle",
  wrapText: options.wrapText ?? false,
  indent: options.align === "left" ? 1 : 0,
};
  if (options.fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.fill },
    };
  }
  if (options.numberFormat) cell.numFmt = options.numberFormat;
  if (options.border !== false) applyThinBorder(cell);
}

function setValue(cell: ExcelJS.Cell, value: CellValue): void {
  // Keep numeric values numeric in Excel. Do not inject currency symbols into
  // the underlying value; currency/unit labels are supplied by table headers.
  cell.value = value === null || value === undefined ? "—" : value;
}

function styleHeaderRow(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  firstColumn: number,
  lastColumn: number,
  fillColor = COLORS.navy,
): void {
  for (let col = firstColumn; col <= lastColumn; col++) {
    const cell = worksheet.getCell(rowNumber, col);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fillColor },
    };
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: COLORS.white },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    applyThinBorder(cell);
  }
  worksheet.getRow(rowNumber).height = 23;
}

export async function exportBalanceSheetToExcel(
  data: BalanceSheetResponseData,
  options: BalanceSheetExportOptions = {},
): Promise<void> {
  const report = getClientBalanceSheetReportData(data, options);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ivora";
  workbook.subject = "Client-format balance sheet statement";
  workbook.title = `Balance Sheet - ${report.reference || report.businessName || "Ivora"}`;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Balance Sheet Statement", {
    properties: { defaultRowHeight: 20 },
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [{ state: "normal", showGridLines: false }],
  });

 worksheet.columns = [
  { key: "particulars", width: 32 },
  { key: "colB", width: 17 },
  { key: "colC", width: 17 },
  { key: "colD", width: 19 },
  { key: "colE", width: 14 },
];

  worksheet.properties.defaultRowHeight = 20;

  // Section A — client worksheet heading.
  worksheet.mergeCells("A1:E1");
  worksheet.getCell("A1").value =
    `${report.reference || report.businessCode || "PAX-2"} (${report.asOfDateFormatted})`;
  worksheet.mergeCells("A2:E2");
  worksheet.getCell("A2").value = report.businessName || "Business";
  worksheet.mergeCells("A3:E3");
  worksheet.getCell("A3").value = "PARTICULARS";

  for (const rowNumber of [1, 2, 3]) {
    const row = worksheet.getRow(rowNumber);
    row.height = rowNumber === 1 ? 26 : 23;
    for (let col = 1; col <= 5; col++) {
      styleCell(worksheet.getCell(rowNumber, col), {
        bold: true,
        italic: true,
        align: "center",
        fill: COLORS.paleYellow,
      });
    }
  }
  worksheet.getCell("A1").font = {
    name: "Calibri", size: 12, bold: true, italic: true, color: { argb: COLORS.black },
  };

  // Section B — purchase and sale summary.
  let row = 5;
  const purchaseHeaderRow = row;
  ["PARTICULARS", "GRM", "GRM RATE", "TOTAL (AED)", "RV RATE"].forEach(
    (label, index) => {
      worksheet.getCell(row, index + 1).value = label;
    },
  );
  styleHeaderRow(worksheet, row, 1, 5);

  row++;
  const purchaseRow = row;
  const purchaseValues: CellValue[] = [
    "PURCHASE",
    report.purchase.grams,
    report.purchase.grmRate,
    report.purchase.totalAED,
    "—",
  ];
  purchaseValues.forEach((value, index) => setValue(worksheet.getCell(row, index + 1), value));
  styleCell(worksheet.getCell(row, 1), { bold: true });
  for (const col of [2, 3, 4]) {
    styleCell(worksheet.getCell(row, col), {
      align: "right",
      numberFormat: col === 3 ? NUMBER_FORMATS.decimal4 : col === 2 ? NUMBER_FORMATS.decimal2 : NUMBER_FORMATS.decimal2,
    });
  }
  styleCell(worksheet.getCell(row, 5), { align: "center" });

  row++;
  const sellRow = row;
  const sellValues: CellValue[] = [
    "SELL",
    report.sell.grams,
    report.sell.grmRate,
    report.sell.totalAED,
    "",
  ];
  sellValues.forEach((value, index) => setValue(worksheet.getCell(row, index + 1), value));
  styleCell(worksheet.getCell(row, 1), { bold: true });
  for (const col of [2, 3, 4]) {
    styleCell(worksheet.getCell(row, col), {
      align: "right",
      numberFormat: col === 3 ? NUMBER_FORMATS.decimal4 : NUMBER_FORMATS.decimal2,
    });
  }
  styleCell(worksheet.getCell(row, 5), { align: "center" });

  row++;
  setValue(worksheet.getCell(row, 4), "RV RATE");
  const rvRate =
    report.sell.rvRate !== null && report.sell.rvRate !== undefined
      ? typeof report.sell.rvRate === "number"
        ? report.sell.rvRate
        : Number.parseFloat(String(report.sell.rvRate))
      : null;
  setValue(worksheet.getCell(row, 5), rvRate !== null && Number.isFinite(rvRate) ? rvRate : "—");
  for (let col = 1; col <= 3; col++) styleCell(worksheet.getCell(row, col), {});
  styleCell(worksheet.getCell(row, 4), { bold: true, align: "right" });
  styleCell(worksheet.getCell(row, 5), {
    align: "right",
    numberFormat: NUMBER_FORMATS.decimal4,
  });

  row++;
  setValue(worksheet.getCell(row, 1), "TOTAL GAP");
  setValue(worksheet.getCell(row, 4), report.totalGapAED);
  for (let col = 1; col <= 5; col++) {
    styleCell(worksheet.getCell(row, col), {
      bold: true,
      fill: col === 4 ? COLORS.paleGreen : "FFF1F4F8",
      align: col === 4 ? "right" : "left",
      numberFormat: col === 4 ? NUMBER_FORMATS.decimal2 : undefined,
    });
  }

  // Section C — Expense Breakdown.
row += 1;

worksheet.mergeCells(row, 1, row, 3);
worksheet.getCell(row, 1).value = "EXPENSE";
styleCell(worksheet.getCell(row, 1), {
  bold: true,
  align: "center",
  fontSize: 11,
});

worksheet.getRow(row).height = 23;

row += 1;
const expenseHeaderRow = row;
  ["PARTICULARS", "INR (₹)", "AED"].forEach((label, index) => {
    worksheet.getCell(row, index + 1).value = label;
  });
  styleHeaderRow(worksheet, row, 1, 3);

  row++;
  const expenseFirstRow = row;
  for (const expense of report.expenses) {
    const label = expense.description
      ? `${expense.particulars} (${expense.description})`
      : expense.particulars;
    setValue(worksheet.getCell(row, 1), label);
    setValue(
      worksheet.getCell(row, 2),
      expense.amountINR !== null && expense.amountINR !== undefined
        ? expense.amountINR
        : "—",
    );
    setValue(worksheet.getCell(row, 3), expense.amountAED);
    styleCell(worksheet.getCell(row, 1), { align: "left", wrapText: true });
    styleCell(worksheet.getCell(row, 2), {
      align: "right",
      numberFormat: NUMBER_FORMATS.integer,
    });
    styleCell(worksheet.getCell(row, 3), {
      align: "right",
      numberFormat: NUMBER_FORMATS.decimal2,
    });
    worksheet.getRow(row).height = 22;
    row++;
  }

  const expenseLastDataRow = row - 1;
  setValue(worksheet.getCell(row, 1), "TOTAL EXP");
  setValue(
    worksheet.getCell(row, 2),
    report.totalExpensesINR !== null ? report.totalExpensesINR : "—",
  );
  setValue(worksheet.getCell(row, 3), report.totalExpensesAED);
  for (let col = 1; col <= 3; col++) {
    styleCell(worksheet.getCell(row, col), {
      bold: true,
      fill: col === 3 ? COLORS.paleGreen : "FFF1F4F8",
      align: col === 1 ? "left" : "right",
      numberFormat: col === 2 ? NUMBER_FORMATS.integer : col === 3 ? NUMBER_FORMATS.decimal2 : undefined,
    });
  }

  // Section D — after-expense balance.
  row += 1;
  worksheet.mergeCells(row, 1, row, 2);
  setValue(worksheet.getCell(row, 1), "AFTER EXP BALANCE (AED)");
  setValue(worksheet.getCell(row, 3), report.afterExpBalanceAED);
  for (let col = 1; col <= 3; col++) {
    styleCell(worksheet.getCell(row, col), {
      bold: true,
      italic: true,
      fill: COLORS.paleYellow,
      fontColor: COLORS.greenText,
      align: col === 1 ? "left" : "right",
      numberFormat: col === 3 ? NUMBER_FORMATS.decimal2 : undefined,
    });
  }
  worksheet.getRow(row).height = 27;

  // Section E — Profit Allocation by Participant.
row += 1;

worksheet.mergeCells(row, 1, row, 4);
worksheet.getCell(row, 1).value =
  "PROFIT ALLOCATION BY PARTICIPANT";

styleCell(worksheet.getCell(row, 1), {
  bold: true,
  align: "center",
  fontSize: 11,
});

worksheet.getRow(row).height = 23;

row += 1;
const participantHeaderRow = row;
  ["NAME", "PER G PROFIT", "GRAM", "PROFIT (AED)"].forEach((label, index) => {
    worksheet.getCell(row, index + 1).value = label;
  });
  styleHeaderRow(worksheet, row, 1, 4, COLORS.navy);

  row++;
  const participantFirstRow = row;
  for (const participant of report.participants) {
    setValue(worksheet.getCell(row, 1), participant.name);
    setValue(worksheet.getCell(row, 2), participant.perGramProfitAED);
    setValue(worksheet.getCell(row, 3), participant.grams);
    setValue(worksheet.getCell(row, 4), participant.profitAED);
    styleCell(worksheet.getCell(row, 1), { align: "left" });
    styleCell(worksheet.getCell(row, 2), {
      align: "right",
      numberFormat: NUMBER_FORMATS.decimal4,
    });
    styleCell(worksheet.getCell(row, 3), {
      align: "right",
      numberFormat: NUMBER_FORMATS.decimal2,
    });
    styleCell(worksheet.getCell(row, 4), {
      align: "right",
      numberFormat: NUMBER_FORMATS.decimal2,
    });
    row++;
  }

  const totalGrams = report.participants.reduce((sum, participant) => sum + participant.grams, 0);
  setValue(worksheet.getCell(row, 1), "TOTAL ALLOCATED PROFIT");
  setValue(worksheet.getCell(row, 3), totalGrams);
  setValue(worksheet.getCell(row, 4), report.totalParticipantProfitAED);
  for (let col = 1; col <= 4; col++) {
    styleCell(worksheet.getCell(row, col), {
      bold: true,
      fill: "FFF1F4F8",
      align: col === 1 ? "left" : "right",
      numberFormat:
        col === 3 ? NUMBER_FORMATS.decimal2 :
        col === 4 ? NUMBER_FORMATS.decimal2 : undefined,
    });
  }

  // Section F — reconciliation.
if (Math.abs(report.unreconciledDifferenceAED) > 0.05) {
  row += 1;

  // Heading aligned with the profit table (A:D).
  worksheet.mergeCells(row, 1, row, 4);
  worksheet.getCell(row, 1).value = "RECONCILIATION SUMMARY";
  styleCell(worksheet.getCell(row, 1), {
    bold: true,
    align: "center",
    fill: COLORS.note,
    border: true,
  });
  worksheet.getRow(row).height = 23;

  row += 1;
  worksheet.mergeCells(row, 1, row, 4);

  const difference = Math.abs(report.unreconciledDifferenceAED);
  worksheet.getCell(row, 1).value =
    `Reconciliation Variance: Participant profits (AED ${Number(report.totalParticipantProfitAED).toFixed(2)}) differ from After-Expense Balance (AED ${Number(report.afterExpBalanceAED).toFixed(2)}) by AED ${difference.toFixed(2)}.`;

  styleCell(worksheet.getCell(row, 1), {
    fontSize: 9,
    align: "left",
    fill: COLORS.note,
    wrapText: true,
    border: true,
  });
  worksheet.getRow(row).height = 32;

  if (report.unreconciledNote) {
    row += 1;
    worksheet.mergeCells(row, 1, row, 4);
    worksheet.getCell(row, 1).value = `Note: ${report.unreconciledNote}`;

    styleCell(worksheet.getCell(row, 1), {
      fontSize: 9,
      align: "left",
      fill: COLORS.note,
      wrapText: true,
      border: true,
    });
    worksheet.getRow(row).height = 32;
  }
}

  // Apply sensible numeric alignment and print settings.
  worksheet.autoFilter = undefined;
  worksheet.pageSetup.printArea = `A1:E${worksheet.rowCount}`;
  worksheet.pageSetup.horizontalCentered = true;
  worksheet.pageSetup.verticalCentered = false;
  worksheet.headerFooter.oddFooter = "&C Ivora — Balance Sheet Statement";
  worksheet.views = [{ state: "normal", showGridLines: false }];

  // Set consistent row heights and avoid cutting off longer labels.
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const currentRow = worksheet.getRow(rowNumber);
    if (!currentRow.height) currentRow.height = 20;
  }

  // Avoid unused variables if the layout changes in the future.
  void purchaseHeaderRow;
  void purchaseRow;
  void sellRow;
  void expenseHeaderRow;
  void expenseFirstRow;
  void expenseLastDataRow;
  void participantHeaderRow;
  void participantFirstRow;

  const filenameSafe = (report.reference || report.businessName || "balance-sheet")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
  const filename = `ivora-balance-sheet-${filenameSafe}-${report.asOfDate}.xlsx`;

  // Browser-side download. ExcelJS writes a standard XLSX ZIP package and
  // native style records, without custom ZIP/XML manipulation.
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Delay revocation so browsers can start the download reliably.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
