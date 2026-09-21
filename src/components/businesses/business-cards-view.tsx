import React from "react";
import { BusinessEntity } from "@/types/business";
import {
  ArrowRightIcon,
  MoreVerticalIcon,
  TableViewIcon,
  WorkspaceCardsIcon,
} from "@/components/ui/icons";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export interface BusinessCardsViewProps {
  businesses: BusinessEntity[];
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  onOpenWorkspace?: (business: BusinessEntity) => void;
}

export function BusinessCardsView({
  businesses,
  viewMode,
  onViewModeChange,
  onOpenWorkspace,
}: BusinessCardsViewProps) {
  return (
    <div className="space-y-4">
      {/* Top Header Bar with toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            All Businesses
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {businesses.length} Entities
          </span>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center p-0.5 rounded-lg border border-gray-200 bg-gray-50/70">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "table"
                ? "bg-[#0c0d12] text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <TableViewIcon size={14} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "cards"
                ? "bg-[#0c0d12] text-white shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <WorkspaceCardsIcon size={14} />
            <span>Workspace Cards</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {businesses.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          No businesses found matching your filters.
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {businesses.map((b) => (
            <StaggerItem key={b.id}>
              <div className="flex flex-col justify-between rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs transition-all hover:border-gray-300">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-950 text-base">
                          {b.name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-800 border border-gray-300 rounded uppercase">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{b.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                      aria-label="More options"
                    >
                      <MoreVerticalIcon size={16} />
                    </button>
                  </div>

                  {/* Partners Pill */}
                  <div className="mt-3.5 inline-block rounded-md bg-gray-50 px-3 py-1.5 border border-gray-100 text-xs text-gray-700 font-medium">
                    <span className="text-gray-400 font-normal mr-1">Partners:</span>
                    {b.partnersSummary}
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        INVESTMENT
                      </span>
                      <span className="text-xs font-bold text-gray-900 mt-0.5 block">
                        AED {b.investmentAED.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        PURCHASE COST
                      </span>
                      <span className="text-xs font-medium text-gray-800 mt-0.5 block">
                        AED {b.purchaseCostAED.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        SALES (INDIA)
                      </span>
                      <span className="text-xs font-medium text-gray-800 mt-0.5 block">
                        AED {b.salesIndiaAED.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        EXPENSES
                      </span>
                      <span className="text-xs font-medium text-gray-800 mt-0.5 block">
                        AED {b.expensesAED.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        NET PROFIT / MARGIN
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-gray-950">
                          AED {b.netProfitAED.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {b.marginPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Created: {b.createdAt}</span>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace?.(b)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg shadow-xs transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRightIcon size={13} />
                  </button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
