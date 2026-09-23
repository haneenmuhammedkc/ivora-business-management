import React from "react";
import { TradingCycleRecord } from "@/types/trading-cycle";

export interface TradingCycleTableViewProps {
  cycles: TradingCycleRecord[];
  selectedCycleId: string | null;
  onSelectCycle: (cycle: TradingCycleRecord) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}

export function TradingCycleTableView({
  cycles,
  selectedCycleId,
  onSelectCycle,
  onToggleSelect,
  onSelectAll,
}: TradingCycleTableViewProps) {
  const allSelected = cycles.length > 0 && cycles.every((c) => c.selected);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
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
                  aria-label="Select all cycles"
                />
              </th>
              <th className="px-3.5 py-3.5 font-bold">CYCLE ID</th>
              <th className="px-3.5 py-3.5 font-bold">BUSINESS</th>
              <th className="px-3.5 py-3.5 font-bold">PURCHASE ID</th>
              <th className="px-3.5 py-3.5 font-bold">SALE ID</th>
              <th className="px-3.5 py-3.5 font-bold">QUANTITY</th>
              <th className="px-3.5 py-3.5 font-bold text-right">PURCHASE COST</th>
              <th className="px-3.5 py-3.5 font-bold text-right">REALIZATION (AED)</th>
              <th className="px-3.5 py-3.5 font-bold text-right">GROSS PROFIT</th>
              <th className="px-3.5 py-3.5 font-bold text-right">EXPENSES</th>
              <th className="px-3.5 py-3.5 font-bold text-right">NET PROFIT</th>
              <th className="px-4 py-3.5 font-bold text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {cycles.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-gray-500">
                  No trading cycle records found matching your filters.
                </td>
              </tr>
            ) : (
              cycles.map((c) => {
                const isCurrent = c.id === selectedCycleId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCycle(c)}
                    className={`transition-colors cursor-pointer hover:bg-gray-50/70 ${
                      isCurrent || c.selected ? "bg-gray-50/50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(c.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!c.selected}
                        onChange={() => onToggleSelect(c.id)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        aria-label={`Select cycle ${c.id}`}
                      />
                    </td>

                    {/* Cycle ID */}
                    <td className="px-3.5 py-4">
                      <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                        {c.id}
                      </span>
                    </td>

                    {/* Business */}
                    <td className="px-3.5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {c.business}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {c.partnerSplit}
                        </span>
                      </div>
                    </td>

                    {/* Purchase ID */}
                    <td className="px-3.5 py-4 whitespace-nowrap font-medium text-gray-800 text-xs">
                      {c.purchaseId}
                    </td>

                    {/* Sale ID */}
                    <td className="px-3.5 py-4 whitespace-nowrap font-medium text-gray-800 text-xs">
                      {c.saleId}
                    </td>

                    {/* Quantity & Commodity */}
                    <td className="px-3.5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs">
                          {c.quantityGms.toLocaleString()} GMS
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5">
                          {c.commodity}
                        </span>
                      </div>
                    </td>

                    {/* Purchase Cost */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                          AED
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 mt-0.5">
                          {c.purchaseCost.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Realization (AED) */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      {c.realizationAED !== null ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                              AED
                            </span>
                            <span className="text-xs sm:text-[13px] font-bold text-gray-950">
                              {c.realizationAED.toLocaleString()}
                            </span>
                          </div>
                          {c.realizationINRLakhs && (
                            <span className="text-[10.5px] text-gray-500 mt-0.5">
                              {c.realizationINRLakhs}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Gross Profit */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      {c.grossProfit !== null ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                            AED
                          </span>
                          <span className="text-xs sm:text-[13px] font-medium text-gray-900 mt-0.5">
                            {c.grossProfit.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Expenses */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      {c.expenses !== null ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                            AED
                          </span>
                          <span className="text-xs sm:text-[13px] font-medium text-gray-900 mt-0.5">
                            {c.expenses.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Net Profit */}
                    <td className="px-3.5 py-4 text-right whitespace-nowrap">
                      {c.netProfit !== null ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                            AED
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold text-gray-950 mt-0.5">
                            {c.netProfit.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      {c.status === "COMPLETED" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white bg-[#0c0d12] rounded uppercase">
                          COMPLETED
                        </span>
                      )}
                      {c.status === "IN PROGRESS" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-700 bg-gray-100 border border-gray-300 rounded uppercase">
                          IN PROGRESS
                        </span>
                      )}
                      {c.status === "PENDING" && (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-500 border border-gray-300 rounded uppercase">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
