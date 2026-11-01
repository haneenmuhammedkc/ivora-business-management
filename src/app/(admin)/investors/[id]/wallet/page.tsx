"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
} from "@/components/ui/icons";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { useAuth } from "@/context/auth-context";
import { InvestorWalletSummary } from "@/types/wallet";
import { InvestorSettlementOverview } from "@/services/investor/settlement.service";
import { BusinessSettlementSummaryTable } from "@/components/investors/wallet/business-settlement-summary-table";
import { RecordDisbursalSection } from "@/components/investors/settlement/record-disbursal-section";
import { WalletLedgerTable } from "@/components/investors/wallet/wallet-ledger-table";
import { WalletAllocateModal } from "@/components/investors/wallet/wallet-allocate-modal";

interface InvestorWalletPageProps {
  params: Promise<{ id: string }>;
}

export default function InvestorWalletPage({ params }: InvestorWalletPageProps) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const investorId = resolvedParams.id;

  const isAdmin = user?.role === "ADMIN";
  const isPartner = user?.role === "PARTNER";

  // 1. Fetch Investor Wallet Summary (includes wallet, kpis, ledger entries, pending withdrawals, and business settlements)
  const {
    data: walletData,
    error: walletError,
    isLoading: isWalletLoading,
    mutate: mutateWallet,
  } = useCachedFetch<InvestorWalletSummary & { success: boolean }>(
    `/api/investors/${encodeURIComponent(investorId)}/wallet`
  );

  // Selected Business for Section C (Payment / Disbursal)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Automatically select the first business when data loads if none selected
  const businessSettlements = walletData?.businessSettlements || [];
  const effectiveBusinessId =
    selectedBusinessId || (businessSettlements.length > 0 ? businessSettlements[0].businessId : null);

  // 2. Fetch Authoritative Settlement Overview for the selected business (for Section C)
  const {
    data: settlementData,
    isLoading: isSettlementLoading,
    mutate: mutateSettlement,
  } = useCachedFetch<{ success: boolean; settlement: InvestorSettlementOverview }>(
    effectiveBusinessId
      ? `/api/investors/${encodeURIComponent(investorId)}/settlement?businessId=${encodeURIComponent(
          effectiveBusinessId
        )}`
      : null
  );

  // Modal State
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  // Refresh all data
  const handleRefreshAll = () => {
    mutateWallet();
    if (effectiveBusinessId) {
      mutateSettlement();
    }
  };

  const kpis = walletData?.kpis;
  const investor = walletData?.investor;

  // Available for Settlement / Reinvestment = cleared wallet balance + eligible uncredited entitlement from closed businesses
  const availableForSettlementOrReinvestment =
    (kpis?.availableBalance ?? 0) + (kpis?.eligibleUncreditedEntitlement ?? 0);

  return (
    <div className="space-y-6 pb-12 print:space-y-0 print:pb-0">
      {/* TOP BREADCRUMB NAVIGATION */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/investors/${investorId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 transition-colors"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Investor Profile</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAllocateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#0c0d12] text-white hover:bg-gray-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Reinvest / Allocate
          </button>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="print:hidden">
        <PageHeader
          title={investor ? `${investor.name} — Settlement & Reinvestment Ledger` : "Investor Settlement & Reinvestment Ledger"}
          subtitle="Manage cross-business settlement entitlements, direct capital/profit disbursals, and capital reinvestments into active businesses."
        />
      </div>

      {/* ERROR BANNER */}
      {walletError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-start gap-3 print:hidden">
          <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load investor settlement ledger</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              {walletError.message || "An unexpected error occurred while loading wallet records."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => mutateWallet()}
            className="px-2.5 py-1 text-xs font-medium bg-white border border-rose-300 text-rose-800 rounded-md hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isWalletLoading && !walletData && (
        <div className="space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse border border-gray-200/60" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse border border-gray-200/60" />
        </div>
      )}

      {walletData && (
        <>
          {/* SECTION A — SETTLEMENT & REINVESTMENT OVERVIEW (5 RESTRAINED CARDS) */}
          <div className="print:hidden">
            <FadeUp delay={0.05}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
                    Section A — Settlement & Reinvestment Overview
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Currency: {walletData.wallet.currency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Available for Settlement / Reinvestment */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Available for Settlement / Reinvestment
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      Eligible
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-950 font-mono">
                    AED {availableForSettlementOrReinvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Settled funds ready for direct payout or reinvestment into active entities
                  </p>
                </div>

                {/* 2. Active Business Entitlement */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Active Business Entitlement
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                      Not Yet Eligible
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-950 font-mono">
                    AED {kpis?.totalActiveBusinessEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Committed capital & profit in active operations; locked until business closure
                  </p>
                </div>

                {/* 3. Total Directly Paid */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Total Directly Paid
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      External Payout
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-950 font-mono">
                    AED {kpis?.totalDirectlyPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Disbursed directly via bank wire, cheque, or cash without wallet transit
                  </p>
                </div>

                {/* 4. Settlement Funds Reinvested */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Settlement Funds Reinvested
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      Reinvested
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-950 font-mono">
                    AED {kpis?.totalReinvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Settlement funds re-allocated directly into other active business contracts
                  </p>
                </div>

                {/* 5. Remaining Settlement Balance (Closed Entities) */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Remaining Settlement Balance
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      Closed Entities
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-gray-950 font-mono">
                    AED {kpis?.totalOutstandingOwedByClosedBusinesses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Unpaid settlement obligations from closed or liquidated business entities
                  </p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>

          {/* SECTION B — BUSINESS SETTLEMENT SUMMARY */}
          <div className="print:hidden">
            <FadeUp delay={0.1}>
              <BusinessSettlementSummaryTable
                settlements={businessSettlements}
                selectedBusinessId={effectiveBusinessId}
                onSelectBusiness={(id) => setSelectedBusinessId(id)}
              />
            </FadeUp>
          </div>

          {/* SECTION C — PAYMENT / DISBURSAL */}
          <div className="print:hidden">
            <FadeUp delay={0.15}>
              <div className="space-y-3">
                {/* Business Selector when investor has multiple businesses */}
                {businessSettlements.length > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                    <div>
                      <label
                        htmlFor="business-select"
                        className="text-xs font-bold text-gray-900 uppercase tracking-wide block"
                      >
                        Target Settlement Business
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Select which business context to disburse capital or profit from.
                      </p>
                    </div>
                    <select
                      id="business-select"
                      value={effectiveBusinessId || ""}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950 cursor-pointer"
                    >
                      {businessSettlements.map((b) => (
                        <option key={b.businessId} value={b.businessId}>
                          {b.businessName} ({b.businessCode}) — Outstanding: AED{" "}
                          {b.remainingOutstandingEntitlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Record Disbursal Section */}
                {settlementData?.settlement ? (
                  <RecordDisbursalSection
                    settlement={settlementData.settlement}
                    isAdmin={isAdmin || isPartner}
                    onPaymentRecorded={handleRefreshAll}
                  />
                ) : isSettlementLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-3 animate-pulse">
                    <div className="h-5 w-40 rounded bg-gray-100" />
                    <div className="h-24 w-full rounded bg-gray-100" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
                    Select a business above to manage settlement disbursals.
                  </div>
                )}
              </div>
            </FadeUp>
          </div>

          {/* SECTION D — SETTLEMENT PAYMENT HISTORY & FUND LEDGER */}
          <div className="w-full">
            <FadeUp delay={0.2} className="print:w-full">
              <div className="space-y-3 print:space-y-0">
                <div className="flex items-center justify-between print:hidden">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-950 uppercase tracking-wide">
                      Section D — Settlement Payment History & Fund Ledger
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Immutable double-entry transaction history with comprehensive search, filters, and export.
                    </p>
                  </div>
                </div>

                <WalletLedgerTable
                  entries={walletData.recentEntries}
                  pendingWithdrawals={walletData.pendingWithdrawals}
                  isAdmin={isAdmin}
                  onRefresh={handleRefreshAll}
                  walletSummary={walletData}
                />
              </div>
            </FadeUp>
          </div>

          {/* REINVEST / ALLOCATE MODAL */}
          <WalletAllocateModal
            isOpen={isAllocateOpen}
            onClose={() => setIsAllocateOpen(false)}
            investorId={investorId}
            investorName={investor?.name || "Investor"}
            availableBalance={kpis?.availableBalance || 0}
            eligibleEntitlements={kpis?.eligibleUncreditedEntitlement || 0}
            businessSettlements={businessSettlements}
            onSuccess={handleRefreshAll}
          />
        </>
      )}
    </div>
  );
}
