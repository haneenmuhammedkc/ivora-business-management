"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import {
  ArrowLeftIcon,
  InvestorsIcon,
  PlusIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import { BusinessWorkspaceDetail } from "@/types/business";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.id;

  const { data, error: fetchError, isLoading } = useCachedFetch<{
    success: boolean;
    business: BusinessWorkspaceDetail;
    message?: string;
    error?: string;
  }>(businessId ? `/api/businesses/${encodeURIComponent(businessId)}` : null);

  const business = data?.business || null;
  const error = fetchError
    ? fetchError.message
    : data && !data.success
    ? data.message || data.error || "Business workspace could not be found."
    : null;

  const [activeTab, setActiveTab] = useState<
    "overview" | "purchases" | "sales" | "expenses" | "investors" | "transactions"
  >("overview");

  if (isLoading) {
    return (
      <div className="space-y-6 pb-14">
        <div className="h-6 w-36 rounded bg-gray-100 animate-pulse" />
        <div className="h-20 w-full rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 w-full rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="space-y-6 pb-14">
        <Link
          href="/businesses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon size={14} />
          <span>Back to Businesses</span>
        </Link>

        <div className="rounded-2xl border border-gray-200/90 bg-white p-10 text-center shadow-2xs max-w-lg mx-auto space-y-4 my-12">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-950">Business Workspace Not Found</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {error || "The requested business could not be found or you do not have permission to access it."}
            </p>
          </div>
          <Link
            href="/businesses"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeftIcon size={13} />
            <span>Return to All Businesses</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Back Navigation Bar */}
      <FadeUp delay={0.05}>
        <div className="flex items-center justify-between">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon size={14} />
            <span>Back to Businesses</span>
          </Link>

          <span className="text-[11px] font-mono text-gray-400 font-medium">
            ENTITY ID: {business.code}
          </span>
        </div>
      </FadeUp>

      {/* Workspace Header */}
      <FadeUp delay={0.08}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border border-gray-200/90 bg-white shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                {business.name}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-800 border border-gray-300 rounded uppercase bg-gray-50/80">
                {business.status}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 border border-blue-200 rounded uppercase bg-blue-50/80">
                {business.businessType || "Gold Bullion"}
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              {business.subtitle}
            </p>

            {/* Single Non-Admin Partner Display */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-400">Partner:</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200/80">
                {business.partnerName}
              </span>
            </div>
          </div>

          {/* Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/investors/business/${encodeURIComponent(business.id)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-2xs"
            >
              <InvestorsIcon size={14} />
              <span>Participants</span>
            </Link>

            <Link
              href={`/investors/new?businessId=${encodeURIComponent(business.id)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg transition-colors shadow-xs"
            >
              <PlusIcon size={14} />
              <span>+ Add Investor</span>
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* 5 Financial Overview KPI Cards */}
      <FadeUp delay={0.12}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Investment */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              TOTAL INVESTMENT
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                AED {business.investmentAED.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                Total Committed Capital
              </span>
            </div>
          </div>

          {/* Purchase Landed Cost */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              PURCHASE COST
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                AED {business.purchaseCostAED.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                {business.purchases.length} Dubai Sourcing Batches
              </span>
            </div>
          </div>

          {/* Sales India Realization */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              SALES (INDIA)
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                AED {business.salesIndiaAED.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                {business.sales.length} Liquidation Trades
              </span>
            </div>
          </div>

          {/* Operational Expenses */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              EXPENSES
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                AED {business.expensesAED.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                {business.expenses.length} Operational Line Items
              </span>
            </div>
          </div>

          {/* Net Profit & Margin */}
          <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              NET PROFIT / MARGIN
            </span>
            <div className="mt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-extrabold text-gray-950">
                  AED {business.netProfitAED.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {business.marginPercentage.toFixed(2)}%
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                Realized Arbitrage Spread
              </span>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Navigation Tabs */}
      <FadeUp delay={0.15}>
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200/90 pb-px text-xs font-semibold">
          {[
            { id: "overview", label: "Overview & Capital", count: undefined },
            { id: "purchases", label: "Purchases", count: business.purchases.length },
            { id: "sales", label: "Sales", count: business.sales.length },
            { id: "expenses", label: "Expenses", count: business.expenses.length },
            { id: "investors", label: "Investors", count: business.investors.length },
            { id: "transactions", label: "Transactions", count: business.transactions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#0c0d12] text-gray-950 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    activeTab === tab.id
                      ? "bg-gray-900 text-white font-mono"
                      : "bg-gray-100 text-gray-600 font-mono"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </FadeUp>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <FadeUp delay={0.18}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Capital Waterfall Breakdown */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Capital Allocation & Equity Structure
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">ADMIN INVESTMENT</span>
                  <span className="text-base font-extrabold text-gray-950 mt-1 block">
                    AED {Number(business.adminInvestmentAED).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Treasury Share: {business.adminEquityPct}%
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">PARTNER INVESTMENT</span>
                  <span className="text-base font-extrabold text-gray-950 mt-1 block">
                    AED {Number(business.partnerInvestmentAED).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Partner: {business.partnerName} ({business.partnerEquityPct}%)
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-gray-50/80 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">EXTERNAL INVESTMENTS</span>
                  <span className="text-base font-extrabold text-gray-950 mt-1 block">
                    AED {business.investments.reduce((acc, inv) => acc + Number(inv.committedAmount), 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {business.investors.length} Registered Participants
                  </span>
                </div>
              </div>

              {/* Operational Route */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">SOURCING & TRADING CORRIDOR</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">
                    Dubai (DXB Vault) → Mumbai (BOM Liquidation Desk)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">BUSINESS TYPE & COMMODITY</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">
                    {business.businessType || "Gold Bullion 999.9"}
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Details Card */}
            <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Partner Profile
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">FULL NAME</span>
                  <span className="font-bold text-gray-950 text-sm mt-0.5 block">
                    {business.partnerName}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">PARTNER EMAIL</span>
                  <span className="font-mono text-gray-800 text-xs mt-0.5 block">
                    {business.partner?.email || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block text-[11px]">ACCOUNT STATUS</span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {business.partner?.status || "ACTIVE"}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-gray-400 font-medium block text-[11px]">WORKSPACE CREATION</span>
                  <span className="text-gray-700 text-xs mt-0.5 block">
                    {business.createdAtFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      )}

      {/* PURCHASES TAB */}
      {activeTab === "purchases" && (
        <FadeUp delay={0.18}>
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950">
                Purchases & Sourcing ({business.purchases.length})
              </h2>
              <Link
                href="/purchase/new"
                className="text-xs font-semibold text-gray-600 hover:text-gray-950 underline"
              >
                + New Purchase Batch
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-bold">PURCHASE CODE</th>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">SOURCING VAULT</th>
                    <th className="px-4 py-3 font-bold text-right">QUANTITY (GMS)</th>
                    <th className="px-4 py-3 font-bold text-right">TOTAL COST (AED)</th>
                    <th className="px-4 py-3 font-bold text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {business.purchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No purchase records registered for this business.
                      </td>
                    </tr>
                  ) : (
                    business.purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-950">{p.purchaseCode}</td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {new Date(p.purchaseDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-gray-800">{p.sourcingVault}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-gray-900">
                          {Number(p.quantityGms).toLocaleString()} g
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-950">
                          AED {Number(p.totalLandedCost).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 border border-gray-200">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}

      {/* SALES TAB */}
      {activeTab === "sales" && (
        <FadeUp delay={0.18}>
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950">
                Sales & Realization ({business.sales.length})
              </h2>
              <Link
                href="/sales/new"
                className="text-xs font-semibold text-gray-600 hover:text-gray-950 underline"
              >
                + New Sale Entry
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-bold">SALE CODE</th>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">BUYER FIRM</th>
                    <th className="px-4 py-3 font-bold text-right">QUANTITY (GMS)</th>
                    <th className="px-4 py-3 font-bold text-right">REALIZED FX</th>
                    <th className="px-4 py-3 font-bold text-right">AED EQUIVALENT</th>
                    <th className="px-4 py-3 font-bold text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {business.sales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No sales records recorded for this business.
                      </td>
                    </tr>
                  ) : (
                    business.sales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-950">{s.saleCode}</td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {new Date(s.saleDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">{s.buyerFirm}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-gray-900">
                          {Number(s.quantityGms).toLocaleString()} g
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-700">
                          {Number(s.realizedFxRate).toFixed(4)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                          AED {Number(s.aedEquivalent).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 border border-gray-200">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}

      {/* EXPENSES TAB */}
      {activeTab === "expenses" && (
        <FadeUp delay={0.18}>
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950">
                Direct & Operating Expenses ({business.expenses.length})
              </h2>
              <Link
                href="/expenses/new"
                className="text-xs font-semibold text-gray-600 hover:text-gray-950 underline"
              >
                + Add Expense
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-bold">EXPENSE CODE</th>
                    <th className="px-4 py-3 font-bold">CATEGORY</th>
                    <th className="px-4 py-3 font-bold">DESCRIPTION</th>
                    <th className="px-4 py-3 font-bold">REF NO</th>
                    <th className="px-4 py-3 font-bold text-right">AMOUNT (AED)</th>
                    <th className="px-4 py-3 font-bold text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {business.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No expenses logged for this business.
                      </td>
                    </tr>
                  ) : (
                    business.expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-950">{e.expenseCode}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 border border-gray-200">
                            {e.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{e.description}</td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">{e.refNo || "—"}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-950">
                          AED {Number(e.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}

      {/* INVESTORS TAB */}
      {activeTab === "investors" && (
        <FadeUp delay={0.18}>
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950">
                Registered Investors & Participants ({business.investments.length})
              </h2>
              <Link
                href={`/investors/new?businessId=${encodeURIComponent(business.id)}`}
                className="text-xs font-semibold text-gray-600 hover:text-gray-950 underline"
              >
                + Add Investor to Business
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-bold">INVESTOR NAME</th>
                    <th className="px-4 py-3 font-bold">CODE</th>
                    <th className="px-4 py-3 font-bold">TYPE</th>
                    <th className="px-4 py-3 font-bold text-right">COMMITTED AMOUNT</th>
                    <th className="px-4 py-3 font-bold text-right">PROFIT SHARE</th>
                    <th className="px-4 py-3 font-bold text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {business.investments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No external investor capital assigned to this business workspace.
                      </td>
                    </tr>
                  ) : (
                    business.investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-950">{inv.investor.name}</td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">{inv.investor.code}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 border border-gray-200">
                            {inv.investor.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-950">
                          AED {Number(inv.committedAmount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-blue-700">
                          {Number(inv.profitSharePct).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <FadeUp delay={0.18}>
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-950">
                Capital Ledger & Treasury Transactions ({business.transactions.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-bold">TRANSACTION CODE</th>
                    <th className="px-4 py-3 font-bold">TYPE</th>
                    <th className="px-4 py-3 font-bold">METHOD</th>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">BANK REF</th>
                    <th className="px-4 py-3 font-bold text-right">AMOUNT (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {business.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No transactions registered for this business entity.
                      </td>
                    </tr>
                  ) : (
                    business.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-950">{tx.transactionCode}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 border border-gray-200">
                            {tx.type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">{tx.paymentMethod.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {new Date(tx.transactionDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">{tx.bankReference || "—"}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-950">
                          AED {Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>
      )}
    </div>
  );
}
