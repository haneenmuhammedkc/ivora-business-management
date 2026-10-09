import React from "react";
import {
  CapitalPositionData,
  InventoryPositionData,
  TradingPositionData,
  PartnerSettlementPositionData,
  BalanceSheetItem,
} from "@/types/balance-sheet";

export interface BalanceSheetStatementProps {
  capital: CapitalPositionData;
  inventory: InventoryPositionData;
  trading: TradingPositionData;
  settlement: PartnerSettlementPositionData;
}

function ItemRow({ item }: { item: BalanceSheetItem }) {
  if (item.isHighlighted) {
    return (
      <div className="p-3.5 rounded-lg bg-[#f0f4f8] border border-[#d6e3ed] space-y-1.5 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-1.5">
            <span className="text-gray-900 text-xs mt-0.5">▸</span>
            <div>
              <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                {item.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`font-black text-xs sm:text-[13px] tracking-tight ${
                item.amountAED < 0 ? "text-rose-600" : "text-gray-950"
              }`}
            >
              {item.amountAED < 0 ? "-" : ""}AED{" "}
              {Math.abs(item.amountAED).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {item.badge && (
              <div className="text-[10px] text-gray-500 font-medium tracking-tight">
                {item.badge}
              </div>
            )}
          </div>
        </div>

        {item.drilldown && (
          <p className="text-[11px] text-gray-600 font-medium pl-4 leading-relaxed">
            {item.drilldown}
          </p>
        )}
        {item.note && (
          <p className="text-[10px] text-gray-500 italic pl-4">{item.note}</p>
        )}
      </div>
    );
  }

  return (
    <div className="py-2.5 space-y-1">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-1.5">
          <span className="text-gray-900 text-xs mt-0.5">▸</span>
          <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
            {item.name}
          </span>
        </div>
        <div className="text-right">
          <span
            className={`font-bold text-xs sm:text-[13px] tracking-tight ${
              item.amountAED < 0 ? "text-rose-600" : "text-gray-900"
            }`}
          >
            {item.amountAED < 0 ? "-" : ""}AED{" "}
            {Math.abs(item.amountAED).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {item.badge && (
            <div className="text-[10.5px] text-gray-500 font-medium tracking-tight">
              {item.badge}
            </div>
          )}
        </div>
      </div>
      {item.drilldown && (
        <p className="text-[11px] text-gray-500 font-normal pl-4 leading-relaxed">
          {item.drilldown}
        </p>
      )}
      {item.note && (
        <p className="text-[10px] text-gray-400 italic pl-4">{item.note}</p>
      )}
    </div>
  );
}

export function BalanceSheetStatement({
  capital,
  inventory,
  trading,
  settlement,
}: BalanceSheetStatementProps) {
  const totalCapitalAndInventory =
    capital.totalCommittedCapitalAED + inventory.totalCarryingValueAED;
  const netRetainedProfit =
    trading.operatingProfitAED - settlement.profitDisbursedAED;

  // Format capital items with simple user-friendly labels
  const cleanCapitalBreakdown = [
    {
      name: "Admin Capital",
      amountAED: capital.adminCapitalAED,
      drilldown: `${capital.adminSharePercent.toFixed(1)}% of capital pool`,
      note: "Institutional & founder contribution",
    },
    {
      name: "Partner Capital",
      amountAED: capital.partnerCapitalAED,
      drilldown: `${capital.partnerSharePercent.toFixed(1)}% of capital pool`,
      note: "External partner contributions",
    },
  ];

  // Format inventory items cleanly
  const cleanInventoryBreakdown = inventory.items.map((item) => ({
    name: `${item.businessName} — ${item.productType.replace(/_/g, " ")}`,
    amountAED: item.carryingValueAED,
    drilldown: `${item.remainingQuantity.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} gms @ AED ${item.averageCostPerUnitAED.toFixed(2)}/g`,
    badge: "In Stock",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* SECTION 1: INVESTMENT & INVENTORY */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
                1. INVESTMENT & INVENTORY
              </h2>
            </div>
            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
              IN AED EQUIVALENT
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* 1.1 INVESTED CAPITAL */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  INVESTED CAPITAL
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  EQUITY SHARE
                </span>
              </div>
              <div className="space-y-1 divide-y divide-gray-100/80">
                {cleanCapitalBreakdown.map((item, idx) => (
                  <ItemRow key={idx} item={item} />
                ))}
              </div>

              {/* Capital Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL INVESTED CAPITAL
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED{" "}
                  {capital.totalCommittedCapitalAED.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* 1.2 INVENTORY ON HAND */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  INVENTORY ON HAND
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  LANDED COST
                </span>
              </div>
              <div className="space-y-1 divide-y divide-gray-100/80">
                {cleanInventoryBreakdown.length === 0 ? (
                  <div className="py-2.5 text-gray-400 text-xs italic">
                    No active inventory in stock.
                  </div>
                ) : (
                  cleanInventoryBreakdown.map((item, idx) => (
                    <ItemRow key={idx} item={item} />
                  ))
                )}
              </div>

              {/* Inventory Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  TOTAL INVENTORY VALUE (
                  {inventory.totalStockGrams.toLocaleString("en-US", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  G)
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED{" "}
                  {inventory.totalCarryingValueAED.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1 Total Box */}
        <div className="p-5 pt-0">
          <div className="h-12 px-4 rounded-lg bg-[#edf4f8] border border-[#d6e3ed] flex items-center justify-between font-bold text-gray-950 shadow-2xs">
            <span className="uppercase text-xs tracking-wider font-black">
              TOTAL INVESTED CAPITAL & INVENTORY
            </span>
            <span className="text-base sm:text-lg font-black">
              AED{" "}
              {totalCapitalAndInventory.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: SALES, COSTS & PROFIT */}
      <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#f8fafc]">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider">
                2. SALES, COSTS & PROFIT
              </h2>
            </div>
            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
              IN AED EQUIVALENT
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* 2.1 CUMULATIVE TRADING FLOW */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  CUMULATIVE PERFORMANCE
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  AMOUNT
                </span>
              </div>

              {/* Clean Waterfall Rows */}
              <div className="space-y-1 divide-y divide-gray-100/80">
                {/* Sales */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-900 text-xs">▸</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                      Sales
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-[13px] text-gray-950">
                    AED{" "}
                    {trading.realizedSalesAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Purchase Cost */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-900 text-xs">▸</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                      Purchase Cost
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-[13px] text-rose-600">
                    -AED{" "}
                    {trading.purchaseSourcingCostAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Operating Expenses */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-900 text-xs">▸</span>
                    <span className="font-bold text-gray-900 text-xs sm:text-[13px]">
                      Operating Expenses
                    </span>
                  </div>
                  <span className="font-bold text-xs sm:text-[13px] text-rose-600">
                    -AED{" "}
                    {trading.operatingExpensesAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Net Profit Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  NET PROFIT (MARGIN: {trading.operatingMarginPercent.toFixed(2)}%)
                </span>
                <span
                  className={`font-extrabold text-sm ${
                    trading.operatingProfitAED >= 0
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  AED{" "}
                  {trading.operatingProfitAED.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* 2.2 PARTNER SETTLEMENT SUBSECTION */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-900">
                  PARTNER SETTLEMENT
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">
                  STATUS
                </span>
              </div>

              <div className="space-y-1 divide-y divide-gray-100/80">
                {/* Entitlement */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">
                    Partner Profit Entitlement
                  </span>
                  <span className="font-semibold text-xs text-gray-900">
                    AED{" "}
                    {settlement.totalPartnerEntitlementAED.toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                {/* Paid Disbursals */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">
                    Less: Paid Disbursals
                  </span>
                  <span className="font-semibold text-xs text-rose-600">
                    -AED{" "}
                    {settlement.profitDisbursedAED.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Pending Partner Disbursal Subtotal */}
              <div className="pt-3 border-t border-dotted border-gray-300 flex items-center justify-between font-bold text-gray-950 text-xs">
                <span className="uppercase text-[11px] tracking-wider text-gray-800">
                  PENDING PARTNER DISBURSAL
                </span>
                <span className="font-extrabold text-sm text-gray-950">
                  AED{" "}
                  {settlement.pendingPartnerDisbursalAED.toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 Total Box: Retained Net Profit */}
        <div className="p-5 pt-0">
          <div className="h-12 px-4 rounded-lg bg-[#0c0d12] text-white flex items-center justify-between font-bold shadow-2xs">
            <span className="uppercase text-xs tracking-wider font-black">
              RETAINED NET PROFIT{" "}
              <span className="text-gray-400 font-normal text-[11px]">
                (NET PROFIT - DISBURSED)
              </span>
            </span>
            <span
              className={`text-base sm:text-lg font-black ${
                netRetainedProfit >= 0 ? "text-white" : "text-rose-400"
              }`}
            >
              AED{" "}
              {netRetainedProfit.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
