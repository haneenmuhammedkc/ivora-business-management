import React from "react";
import { QuickDeskPayload } from "@/types/reports";

export interface QuickDeskContentProps {
  activeTabId: string;
  data?: QuickDeskPayload;
  isLoading?: boolean;
}

export function QuickDeskContent({
  activeTabId,
  data,
  isLoading = false,
}: QuickDeskContentProps) {
  if (isLoading || !data) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-2xs text-center">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Syncing Quick Desk real-time ledger metrics...</p>
      </div>
    );
  }

  // 1. TODAY'S ACTIVITY
  if (activeTabId === "today") {
    const { today } = data;
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs space-y-4">
        {/* Metric Pill Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Purchases Today ({today.purchaseCount})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {today.totalPurchasesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Sales Today ({today.saleCount})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {today.totalSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Expenses Today ({today.expenseCount})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {today.totalExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/80 p-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Net Cash Flow
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-900 mt-1 block">
              AED {today.netCashAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Recent Activity Ledger List */}
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Recent Movements & Orders
            </h4>
            <span className="text-[10px] font-semibold text-gray-400 font-mono">
              Live DB Transactions
            </span>
          </div>

          {today.recentActivity.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center italic">
              No transaction entries recorded for today yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {today.recentActivity.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                        item.type === "SALE"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.type === "PURCHASE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.type}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-gray-900 mr-2">{item.code}</span>
                      <span className="text-gray-500">{item.description}</span>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-extrabold text-gray-900 block">
                      AED {item.amountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. MONTHLY PERFORMANCE
  if (activeTabId === "monthly") {
    const { monthly } = data;
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Current Month Performance — {monthly.currentMonthLabel}
          </h4>
          <span className="text-[10px] font-bold text-gray-500 uppercase">
            Margin: {monthly.profitMarginPct.toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              MTD Sales
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {monthly.totalSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              MTD Purchases
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {monthly.totalPurchasesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              MTD Expenses
            </span>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 block">
              AED {monthly.totalExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="rounded-lg bg-gray-900 text-white p-3">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">
              MTD Net Profit
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white mt-1 block">
              AED {monthly.netProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 bg-gray-50/70 rounded-lg p-2.5 border border-gray-200/80">
          <span>
            Previous Month Sales: <strong className="text-gray-900">AED {monthly.previousMonthSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </span>
          <span>
            MoM Growth:{" "}
            <strong className={monthly.salesGrowthPct >= 0 ? "text-emerald-700" : "text-rose-700"}>
              {monthly.salesGrowthPct >= 0 ? "+" : ""}{monthly.salesGrowthPct.toFixed(2)}%
            </strong>
          </span>
        </div>
      </div>
    );
  }

  // 3. BUSINESS COMPARISON
  if (activeTabId === "business") {
    const { business } = data;
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Entity Comparative Ledger
          </h4>
          <span className="text-[10px] font-semibold text-gray-500 font-mono">
            {business.length} Entities Registered
          </span>
        </div>

        {business.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center italic">
            No authorized entities found.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                <th className="pb-2">Entity Name</th>
                <th className="pb-2">Code</th>
                <th className="pb-2 text-right">Sales (AED)</th>
                <th className="pb-2 text-right">Purchases (AED)</th>
                <th className="pb-2 text-right">Expenses (AED)</th>
                <th className="pb-2 text-right">Net Profit (AED)</th>
                <th className="pb-2 text-right">Margin %</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {business.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 font-bold text-gray-900">{b.name}</td>
                  <td className="py-2.5 text-gray-500 font-mono">{b.code}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">
                    {b.totalSalesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-gray-700">
                    {b.totalPurchasesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-gray-700">
                    {b.totalExpensesAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-gray-950">
                    {b.netProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right font-bold text-gray-800">
                    {b.marginPct.toFixed(2)}%
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // 4. INVESTOR SUMMARY
  if (activeTabId === "investor") {
    const { investor } = data;
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Investor Capital & Yield Schedule
          </h4>
          <span className="text-[10px] font-semibold text-gray-500 font-mono">
            {investor.length} Registered Investors & Partners
          </span>
        </div>

        {investor.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center italic">
            No investor records found.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                <th className="pb-2">Investor Name</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Entity</th>
                <th className="pb-2">Type</th>
                <th className="pb-2 text-right">Committed Capital (AED)</th>
                <th className="pb-2 text-right">Profit Share %</th>
                <th className="pb-2 text-right">Est. Profit (AED)</th>
                <th className="pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {investor.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-2.5 font-bold text-gray-900">{inv.name}</td>
                  <td className="py-2.5 text-gray-500 font-mono">{inv.code}</td>
                  <td className="py-2.5 text-gray-700">{inv.businessName}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-gray-100 text-gray-800">
                      {inv.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">
                    {inv.committedCapitalAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right font-bold text-gray-800">
                    {inv.profitSharePct.toFixed(2)}%
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-gray-950">
                    {inv.estimatedProfitAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // 5. EXPENSE ANALYSIS
  if (activeTabId === "expense") {
    const { expense } = data;
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Operational Logistics & Overhead Categories
          </h4>
          <span className="text-[10px] font-semibold text-gray-500 font-mono">
            {expense.length} Itemized Categories
          </span>
        </div>

        {expense.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center italic">
            No operating expenses recorded for selected scope.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expense.map((cat) => (
              <div
                key={cat.category}
                className="rounded-lg border border-gray-200/90 bg-gray-50/50 p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{cat.category}</span>
                  <span className="font-extrabold text-gray-950">
                    AED {cat.totalAmountAED.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10.5px] text-gray-500">
                  <span>{cat.count} {cat.count === 1 ? "vouchers" : "vouchers"}</span>
                  <span className="font-semibold text-gray-700">{cat.percentageOfTotal.toFixed(1)}% of total</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gray-900 h-1.5 rounded-full"
                    style={{ width: `${Math.min(cat.percentageOfTotal, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
