import React from "react";
import { InvestorRecord } from "@/types/investors";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface InvestorTableViewProps {
  investors: InvestorRecord[];
  selectedInvestorId: string | null;
  onSelectInvestor: (investor: InvestorRecord) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onExportSelected?: () => void;
  onBatchNotice?: () => void;
}

export function InvestorTableView({
  investors,
  selectedInvestorId,
  onSelectInvestor,
  onToggleSelect,
  onSelectAll,
  onExportSelected,
  onBatchNotice,
}: InvestorTableViewProps) {
  const allSelected = investors.length > 0 && investors.every((inv) => inv.selected);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Investors
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {investors.length} Records
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportSelected}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Export Selected
          </button>
          <button
            type="button"
            onClick={onBatchNotice}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Batch Notice
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="w-12 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                  aria-label="Select all investors"
                />
              </th>
              <th className="px-4 py-3.5 font-bold">INVESTOR</th>
              <th className="px-4 py-3.5 font-bold">BUSINESS</th>
              <th className="px-4 py-3.5 font-bold text-right">INVESTMENT</th>
              <th className="px-4 py-3.5 font-bold">DATE</th>
              <th className="px-3.5 py-3.5 font-bold text-center">SHARE %</th>
              <th className="px-4 py-3.5 font-bold text-right">ALLOCATED</th>
              <th className="px-4 py-3.5 font-bold text-right">PAID</th>
              <th className="px-4 py-3.5 font-bold text-right">OUTSTANDING</th>
              <th className="px-3.5 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-4 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {investors.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-500">
                  No investors found matching your filters.
                </td>
              </tr>
            ) : (
              investors.map((inv) => {
                const isCurrent = inv.id === selectedInvestorId;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvestor(inv)}
                    className={`transition-colors cursor-pointer hover:bg-gray-50/70 ${
                      isCurrent ? "bg-gray-50/60" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(inv.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!inv.selected}
                        onChange={() => onToggleSelect(inv.id)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        aria-label={`Select investor ${inv.name}`}
                      />
                    </td>

                    {/* Investor Info */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                            {inv.name}
                          </span>
                          {inv.isMultiEntity && (
                            <span className="px-1.5 py-0.2 text-[9.5px] font-bold text-gray-600 border border-gray-300 rounded uppercase">
                              MULTI
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {inv.emailOrSubtitle}
                        </span>
                      </div>
                    </td>

                    {/* Business */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {inv.business}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {inv.businessEntity}
                        </span>
                      </div>
                    </td>

                    {/* Investment */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                          AED
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 mt-0.5">
                          {inv.investmentAED.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {inv.date}
                    </td>

                    {/* Share % */}
                    <td className="px-3.5 py-4 text-center">
                      <span className="font-bold text-gray-950 text-xs">
                        {inv.sharePercent}%
                      </span>
                    </td>

                    {/* Allocated */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-gray-900">
                        AED {inv.allocatedProfitAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-600">
                        AED {inv.paidAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Outstanding */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-gray-950">
                        AED {inv.outstandingAED.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center">
                      {inv.status === "ACTIVE" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
                          ACTIVE
                        </span>
                      )}
                      {inv.status === "PENDING" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-500 border border-gray-300 rounded uppercase">
                          PENDING
                        </span>
                      )}
                      {inv.status === "CLEARED" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-600 border border-gray-300 bg-gray-50 rounded uppercase">
                          CLEARED
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvestor(inv);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowRightIcon size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="font-semibold text-gray-900">1-{investors.length}</strong> of{" "}
            <strong className="font-semibold text-gray-900">8</strong> investors
          </span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <span>Rows:</span>
            <select
              defaultValue="10"
              className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-gray-900"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#0c0d12] rounded">
            1
          </span>
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
