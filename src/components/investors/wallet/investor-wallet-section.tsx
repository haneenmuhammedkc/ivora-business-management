"use client";

import React, { useState } from "react";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { InvestorWalletSummary } from "@/types/wallet";
import { WalletDepositModal } from "./wallet-deposit-modal";
import { WalletAllocateModal } from "./wallet-allocate-modal";
import { WalletWithdrawalModal } from "./wallet-withdrawal-modal";
import { WalletLedgerTable } from "./wallet-ledger-table";

interface InvestorWalletSectionProps {
  investorId: string;
  investorName: string;
  isAdmin: boolean;
}

export function InvestorWalletSection({
  investorId,
  investorName,
  isAdmin,
}: InvestorWalletSectionProps) {
  const { data, error, isLoading, mutate } = useCachedFetch<{
    success: boolean;
    wallet: InvestorWalletSummary["wallet"];
    kpis: InvestorWalletSummary["kpis"];
    recentEntries: InvestorWalletSummary["recentEntries"];
    pendingWithdrawals: InvestorWalletSummary["pendingWithdrawals"];
    businessSettlements: InvestorWalletSummary["businessSettlements"];
  }>(isAdmin ? `/api/investors/${encodeURIComponent(investorId)}/wallet` : null);

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  if (!isAdmin) {
    return null; // Restricted exclusively to Admins
  }

  if (isLoading && !data) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 shadow-2xs space-y-4">
        <div className="h-6 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-amber-900">Personal Wallet Unavailable</h3>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {error.message || "Could not retrieve investor wallet balance and ledger history."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100/50 shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          Retry Wallet
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const kpis = data.kpis;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
              Personal Investor Wallet & Fund Ledger
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              AED POOL
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Independent personal wallet for capital deposits, settlement credits, cross-business reinvestments, and withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setIsDepositOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#0c0d12] hover:bg-gray-800 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            + Deposit Funds
          </button>
          <button
            type="button"
            onClick={() => setIsAllocateOpen(true)}
            disabled={((kpis.availableBalance ?? 0) + (kpis.eligibleUncreditedEntitlement ?? 0)) <= 0}
            className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 disabled:opacity-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Allocate to Business
          </button>
          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            disabled={kpis.availableBalance <= 0}
            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Available Balance */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              AVAILABLE CASH BALANCE
            </span>
            <div className="mt-2">
              <span className="text-xl font-black text-emerald-950 font-mono block">
                AED {kpis.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-emerald-700 font-medium block mt-0.5">
                Ready for reinvestment or withdrawal
              </span>
            </div>
          </div>

          {/* Card 2: Reserved Balance */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              RESERVED FUNDS (PENDING)
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-gray-950 font-mono block">
                AED {kpis.reservedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 font-medium block mt-0.5">
                {kpis.pendingWithdrawalsCount} pending withdrawal(s)
              </span>
            </div>
          </div>

          {/* Card 3: Capital Returned & Profit Credited */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              SETTLEMENT CREDITS
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-gray-950 font-mono block">
                AED {(kpis.totalCapitalReturned + kpis.totalProfitCredited).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 font-medium block mt-0.5">
                Cap: AED {kpis.totalCapitalReturned.toLocaleString()} • Prf: AED {kpis.totalProfitCredited.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Card 4: Total Reinvested & Withdrawn */}
          <div className="p-4 rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              OUTFLOW / ALLOCATIONS
            </span>
            <div className="mt-2">
              <span className="text-lg font-bold text-gray-950 font-mono block">
                AED {(kpis.totalReinvested + kpis.totalWithdrawn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-gray-500 font-medium block mt-0.5">
                Reinvested: AED {kpis.totalReinvested.toLocaleString()} • Withdrawn: AED {kpis.totalWithdrawn.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div>
          <div className="mb-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Complete Wallet Transaction History
            </h3>
            <p className="text-[11px] text-gray-500">
              Immutable ledger entries detailing all inward deposits, business allocations, returned capital, and disbursements.
            </p>
          </div>

          <WalletLedgerTable
            entries={data.recentEntries}
            pendingWithdrawals={data.pendingWithdrawals}
            isAdmin={isAdmin}
            onRefresh={mutate}
            walletSummary={data as unknown as InvestorWalletSummary}
          />
        </div>
      </div>

      {/* Modals */}
      {isDepositOpen && (
        <WalletDepositModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
          investorId={investorId}
          investorName={investorName}
          onSuccess={mutate}
        />
      )}

      {isAllocateOpen && (
        <WalletAllocateModal
          isOpen={isAllocateOpen}
          onClose={() => setIsAllocateOpen(false)}
          investorId={investorId}
          investorName={investorName}
          availableBalance={kpis.availableBalance}
          eligibleEntitlements={kpis.eligibleUncreditedEntitlement || 0}
          businessSettlements={data.businessSettlements || []}
          onSuccess={mutate}
        />
      )}

      {isWithdrawOpen && (
        <WalletWithdrawalModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          investorId={investorId}
          investorName={investorName}
          availableBalance={kpis.availableBalance}
          onSuccess={mutate}
        />
      )}
    </div>
  );
}
