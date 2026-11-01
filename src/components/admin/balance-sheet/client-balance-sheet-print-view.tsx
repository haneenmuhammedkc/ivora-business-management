"use client";

import React from "react";
import { ClientBalanceSheetReportData } from "@/types/balance-sheet";

interface ClientBalanceSheetPrintViewProps {
  report: ClientBalanceSheetReportData;
}

export function ClientBalanceSheetPrintView({
  report,
}: ClientBalanceSheetPrintViewProps) {
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

  const totalExpAedStr = report.totalExpensesAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const totalExpInrStr =
    report.totalExpensesINR !== null
      ? `₹ ${report.totalExpensesINR.toLocaleString("en-IN")}`
      : "—";

  const afterExpStr = report.afterExpBalanceAED.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalGramsSum = report.participants.reduce((sum, p) => sum + p.grams, 0);
  const totalAllocatedProfitStr = report.totalParticipantProfitAED.toLocaleString(
    "en-US",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  return (
    <div className="hidden print:block w-full text-black font-sans text-[10pt] leading-tight space-y-4">
      {/* 1. Header Banner */}
      <div className="border-b-2 border-gray-900 pb-2 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-950">IVORA</h1>
          <p className="text-[8.5pt] uppercase font-bold text-gray-700 tracking-wider">
            Balance Sheet Statement — Client Realization Record
          </p>
        </div>
        <div className="text-right text-[8pt] text-gray-600">
          <div>Report Date: <span className="font-bold text-gray-900">{report.asOfDateFormatted}</span></div>
          <div>Currency: <span className="font-bold text-gray-900">AED / INR</span></div>
        </div>
      </div>

      {/* 2. Section A: Business Heading Metadata Box */}
      <div className="border border-gray-300 rounded p-2.5 bg-gray-50 flex justify-between items-center text-[9pt]">
        <div className="space-y-1">
          <div>
            <span className="font-bold text-gray-600 text-[8pt] uppercase mr-2">Business / Reference:</span>
            <span className="font-black text-gray-950">{report.reference || report.businessCode || "PAX-2"}</span>
          </div>
          <div>
            <span className="font-bold text-gray-600 text-[8pt] uppercase mr-2">Business / Participant:</span>
            <span className="font-black text-gray-950">{report.businessName || "PAX-ABI C OF SAMEER"}</span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div>
            <span className="font-bold text-gray-600 text-[8pt] uppercase mr-2">Date:</span>
            <span className="font-bold text-gray-900">{report.asOfDateFormatted}</span>
          </div>
          <div>
            <span className="font-bold text-gray-600 text-[8pt] uppercase mr-2">Status:</span>
            <span className="font-bold text-gray-900">Verified Cleared / Pending</span>
          </div>
        </div>
      </div>

      {/* 3. Section B: Purchase & Sale Summary */}
      <div className="space-y-1.5">
        <h2 className="text-[9pt] font-black uppercase text-gray-900 tracking-wider">
          1. Purchase & Sale Summary
        </h2>
        <table className="w-full border-collapse border border-gray-400 text-[8.5pt]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="border border-gray-400 py-1 px-2 text-left font-bold">PARTICULARS</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">GRM</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">GRM RATE</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">TOTAL (AED)</th>
              <th className="border border-gray-400 py-1 px-2 text-center font-bold">RV RATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 py-1 px-2 font-bold">PURCHASE</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono">
                {report.purchase.grams.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
              </td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono">{purchaseRateStr}</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-bold">AED {purchaseTotalStr}</td>
              <td className="border border-gray-400 py-1 px-2 text-center text-gray-400">—</td>
            </tr>
            <tr>
              <td className="border border-gray-400 py-1 px-2 font-bold">SELL</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono">
                {report.sell.grams.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
              </td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono">{sellRateStr}</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-bold">AED {sellTotalStr}</td>
              <td className="border border-gray-400 py-1 px-2 text-center font-mono">{rvRateStr}</td>
            </tr>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
              <td className="border border-gray-400 py-1 px-2 font-black">TOTAL GAP</td>
              <td className="border border-gray-400 py-1 px-2"></td>
              <td className="border border-gray-400 py-1 px-2"></td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-black text-gray-950">
                AED {totalGapStr}
              </td>
              <td className="border border-gray-400 py-1 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Section C: Expense Breakdown */}
      <div className="space-y-1.5">
        <h2 className="text-[9pt] font-black uppercase text-gray-900 tracking-wider">
          2. Expense Breakdown
        </h2>
        <table className="w-full border-collapse border border-gray-400 text-[8.5pt]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="border border-gray-400 py-1 px-2 text-left font-bold w-1/2">PARTICULARS</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold w-1/4">INR</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold w-1/4">AED</th>
            </tr>
          </thead>
          <tbody>
            {report.expenses.map((exp) => (
              <tr key={exp.id}>
                <td className="border border-gray-400 py-1 px-2 font-medium">
                  {exp.particulars}
                  {exp.description ? (
                    <span className="text-gray-600 text-[7.5pt] ml-1">({exp.description})</span>
                  ) : null}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-mono">
                  {exp.amountINR !== null ? `₹ ${exp.amountINR.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-mono font-semibold">
                  AED {exp.amountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
              <td className="border border-gray-400 py-1 px-2 font-black">TOTAL EXP</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-bold">
                {totalExpInrStr}
              </td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-black text-gray-950">
                AED {totalExpAedStr}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Section D: After-Expense Balance Callout Box */}
      <div className="border border-gray-900 bg-gray-50 rounded p-2 flex justify-between items-center">
        <span className="font-black text-[9.5pt] uppercase text-gray-950">
          AFTER EXP BALANCE
        </span>
        <span className="font-black font-mono text-[11pt] text-gray-950">
          AED {afterExpStr}
        </span>
      </div>

      {/* 6. Section E: Profit Allocation by Participant */}
      <div className="space-y-1.5">
        <h2 className="text-[9pt] font-black uppercase text-gray-900 tracking-wider">
          3. Profit Allocation By Participant
        </h2>
        <table className="w-full border-collapse border border-gray-400 text-[8.5pt]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="border border-gray-400 py-1 px-2 text-left font-bold">NAME</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">PER G PROFIT</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">GRAM</th>
              <th className="border border-gray-400 py-1 px-2 text-right font-bold">PROFIT</th>
            </tr>
          </thead>
          <tbody>
            {report.participants.map((part) => (
              <tr key={part.id || part.name}>
                <td className="border border-gray-400 py-1 px-2 font-bold">{part.name}</td>
                <td className="border border-gray-400 py-1 px-2 text-right font-mono">
                  {part.perGramProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-mono">
                  {part.grams.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-mono font-bold">
                  AED {part.profitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
              <td className="border border-gray-400 py-1 px-2 font-black">TOTAL ALLOCATED PROFIT</td>
              <td className="border border-gray-400 py-1 px-2"></td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-bold">
                {totalGramsSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border border-gray-400 py-1 px-2 text-right font-mono font-black text-gray-950">
                AED {totalAllocatedProfitStr}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. Reconciliation Note if applicable */}
      {Math.abs(report.unreconciledDifferenceAED) > 0.05 ? (
        <div className="border border-gray-300 p-2 text-[7.5pt] text-gray-700 bg-gray-50 rounded">
          <div className="font-bold">
            Reconciliation Note: After-Expense Balance is AED {afterExpStr}, while total participant profit allocations sum to AED {totalAllocatedProfitStr} (difference: AED {Math.abs(report.unreconciledDifferenceAED).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).
          </div>
          <div>
            {report.unreconciledNote || "Allocations reflect participant contractual distribution on gross trading gap prior to deducting operational expenses."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
