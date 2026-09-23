import React from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface LifecycleStage {
  step: string;
  label: string;
  amount: string;
  subtext: string;
  hasDot?: boolean;
}

export interface LifecycleMargin {
  grossProfitLabel: string;
  grossProfitAmount: string;
  grossProfitPercentage: string;
  deductionLabel: string;
  deductionAmount: string;
}

export interface LifecycleNetResult {
  label: string;
  amount: string;
  netMarginPercentage: string;
}

export interface TradingCycleItem {
  id: string;
  purchase: LifecycleStage;
  realization: LifecycleStage;
  freightLabel: string;
  marginLabel: string;
  margin: LifecycleMargin;
  netRealized: LifecycleNetResult;
}

export const MOCK_TRADING_CYCLES: TradingCycleItem[] = [
  {
    id: "cycle-1",
    purchase: {
      step: "1.",
      label: "DUBAI PURCHASE",
      amount: "AED 185,400",
      subtext: "Physical Bullion Cleared",
      hasDot: true,
    },
    freightLabel: "Freight",
    realization: {
      step: "2.",
      label: "INDIA REALIZATION",
      amount: "AED 235,600",
      subtext: "₹53,57,544 Settlement",
      hasDot: true,
    },
    marginLabel: "Margin",
    margin: {
      grossProfitLabel: "GROSS PROFIT",
      grossProfitAmount: "AED 50,200",
      grossProfitPercentage: "+27.07%",
      deductionLabel: "Less",
      deductionAmount: "- AED 12.8k",
    },
    netRealized: {
      label: "NET REALIZED",
      amount: "AED 37,350",
      netMarginPercentage: "15.85% Net",
    },
  },
  {
    id: "cycle-2",
    purchase: {
      step: "1.",
      label: "DUBAI PURCHASE",
      amount: "AED 185,400",
      subtext: "Physical Bullion Cleared",
      hasDot: true,
    },
    freightLabel: "Freight",
    realization: {
      step: "2.",
      label: "INDIA REALIZATION",
      amount: "AED 235,600",
      subtext: "₹53,57,544 Settlement",
      hasDot: true,
    },
    marginLabel: "Margin",
    margin: {
      grossProfitLabel: "GROSS PROFIT",
      grossProfitAmount: "AED 50,200",
      grossProfitPercentage: "+27.07%",
      deductionLabel: "Less",
      deductionAmount: "- AED 12.8k",
    },
    netRealized: {
      label: "NET REALIZED",
      amount: "AED 37,350",
      netMarginPercentage: "15.85% Net",
    },
  },
  {
    id: "cycle-3",
    purchase: {
      step: "1.",
      label: "DUBAI PURCHASE",
      amount: "AED 185,400",
      subtext: "Physical Bullion Cleared",
      hasDot: true,
    },
    freightLabel: "Freight",
    realization: {
      step: "2.",
      label: "INDIA REALIZATION",
      amount: "AED 235,600",
      subtext: "₹53,57,544 Settlement",
      hasDot: true,
    },
    marginLabel: "Margin",
    margin: {
      grossProfitLabel: "GROSS PROFIT",
      grossProfitAmount: "AED 50,200",
      grossProfitPercentage: "+27.07%",
      deductionLabel: "Less",
      deductionAmount: "- AED 12.8k",
    },
    netRealized: {
      label: "NET REALIZED",
      amount: "AED 37,350",
      netMarginPercentage: "15.85% Net",
    },
  },
];

export interface PhysicalTradingLifecycleProps {
  cycles?: TradingCycleItem[];
  routeBadge?: string;
  statusText?: string;
}

export function PhysicalTradingLifecycle({
  cycles = MOCK_TRADING_CYCLES,
  routeBadge = "DUBAI (DXB) → MUMBAI (BOM)",
  statusText = "Active Cycle Pipeline • 100% Reconciled",
}: PhysicalTradingLifecycleProps) {
  return (
    <div className="rounded-lg border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-gray-100 bg-white gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            PHYSICAL TRADING LIFECYCLE
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-gray-700 bg-white border border-gray-200 shadow-2xs">
            {routeBadge}
          </span>
        </div>
        <span className="text-[11px] font-medium text-gray-500">
          {statusText}
        </span>
      </div>

      {/* Cycle Rows */}
      <div className="p-4 sm:p-5 space-y-3">
        {cycles.map((cycle) => (
          <div
            key={cycle.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 lg:gap-3 p-3.5 rounded-lg border border-gray-200/80 bg-white items-center text-xs shadow-2xs"
          >
            {/* Stage 1: Dubai Purchase */}
            <div className="lg:col-span-3 p-3 rounded-md bg-white border border-gray-200/80 flex flex-col justify-between min-h-[76px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {cycle.purchase.step} {cycle.purchase.label}
                </span>
                {cycle.purchase.hasDot && (
                  <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                )}
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-gray-900 leading-tight mt-1">
                  {cycle.purchase.amount}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {cycle.purchase.subtext}
                </div>
              </div>
            </div>

            {/* Transition 1: Freight */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center text-gray-400 py-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                {cycle.freightLabel}
              </span>
              <ArrowRightIcon size={14} className="text-gray-500 mt-0.5 rotate-90 lg:rotate-0" />
            </div>

            {/* Stage 2: India Realization */}
            <div className="lg:col-span-3 p-3 rounded-md bg-white border border-gray-200/80 flex flex-col justify-between min-h-[76px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {cycle.realization.step} {cycle.realization.label}
                </span>
                {cycle.realization.hasDot && (
                  <span className="h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                )}
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-gray-900 leading-tight mt-1">
                  {cycle.realization.amount}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                  {cycle.realization.subtext}
                </div>
              </div>
            </div>

            {/* Transition 2: Margin */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center text-gray-400 py-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                {cycle.marginLabel}
              </span>
              <ArrowRightIcon size={14} className="text-gray-500 mt-0.5 rotate-90 lg:rotate-0" />
            </div>

            {/* Gross Profit & Deductions Area */}
            <div className="lg:col-span-2 flex items-center justify-between px-3.5 py-2.5 rounded-md bg-white border border-gray-200/80 min-h-[76px]">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  {cycle.margin.grossProfitLabel}
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">
                  {cycle.margin.grossProfitAmount}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  {cycle.margin.grossProfitPercentage}
                </div>
              </div>
              <div className="text-right pl-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  {cycle.margin.deductionLabel}
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-800 leading-tight mt-0.5 whitespace-nowrap">
                  {cycle.margin.deductionAmount}
                </div>
              </div>
            </div>

            {/* Net Realized Box */}
            <div className="lg:col-span-2 p-3 rounded-md bg-[#0c0d12] text-white min-h-[76px] flex flex-col justify-between shadow-xs">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                {cycle.netRealized.label}
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
                  {cycle.netRealized.amount}
                </div>
                <div className="text-[10px] text-gray-300 mt-0.5 font-medium">
                  {cycle.netRealized.netMarginPercentage}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
