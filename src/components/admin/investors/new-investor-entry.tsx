"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, InvestorsIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InvestorRecord, InvestorStatus } from "@/types/investors";

export interface NewInvestorEntryProps {
  onRecordInvestor?: (investor: InvestorRecord) => void;
}

export function NewInvestorEntry({ onRecordInvestor }: NewInvestorEntryProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("Business 01 (Entity A + B)");
  const [investmentAmount, setInvestmentAmount] = useState("100000");
  const [equityShare, setEquityShare] = useState("35");
  const [contractType, setContractType] = useState("Standard Contract (Escrow Protected)");
  const [escrowAccount, setEscrowAccount] = useState("Direct Bank Wire (ENBD - DXB Operating Escrow)");

  const investNum = Number(investmentAmount) || 0;
  const shareNum = Number(equityShare) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newInvestor: InvestorRecord = {
      id: "INV-004",
      name: name || "New Investor",
      emailOrSubtitle: `INV-004 • ${email || "investor@ivora-trade.ae"}`,
      business: business.split(" (")[0] || "Business 01",
      businessEntity: business.includes("(") ? business.split("(")[1].replace(")", "") : "Entity A + B",
      entityLabel: `${business} • INV-004`,
      investmentAED: investNum,
      date: "22 Sep 2026",
      sharePercent: shareNum,
      allocatedProfitAED: 0,
      paidAED: 0,
      outstandingAED: 0,
      status: "ACTIVE" as InvestorStatus,
      selected: false,
      details: {
        totalInvestmentAED: investNum,
        profitShare: `${shareNum}%`,
        profitShareContract: contractType,
        allocatedProfit: 0,
        outstandingBalance: 0,
        paidAmount: 0,
        cycleAllocation: {
          cycleId: "TR-0249",
          netCycleProfitAED: 0,
          contractedRatio: `× ${shareNum}%`,
          investorProfitCreditAED: 0,
          allocationDate: "22 Sep 2026",
          status: "Pending Allocation",
        },
        recentTransactions: [
          {
            id: "CAP-004",
            title: "Initial Investment Capital",
            date: "22 Sep 2026",
            reference: escrowAccount,
            amountFormatted: `AED ${investNum.toLocaleString()} Cleared`,
            type: "INWARD REMITTANCE",
          },
        ],
      },
    };

    if (onRecordInvestor) {
      onRecordInvestor(newInvestor);
    }
    router.push("/investors");
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
            <InvestorsIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-950">
                New Investor Registration
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Register capital allocation, partner equity terms, and settlement escrow.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. INVESTOR PROFILE */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              01. INVESTOR PROFILE & IDENTITY
            </span>
            <span className="text-xs font-mono font-bold text-gray-900">
              ID: INV-004
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Investor / Firm Name"
              placeholder="e.g. Partner D / Alpha Capital"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Contact Email / Reference"
              placeholder="e.g. partner@ivora-trade.ae"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 02. BUSINESS ALLOCATION & TERMS */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            02. BUSINESS ALLOCATION & EQUITY TERMS
          </span>

          <Select
            label="Assigned Business Entity"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            options={[
              {
                value: "Business 01 (Entity A + B)",
                label: "Business 01 (Entity A + B)",
              },
              {
                value: "Business 02 (Entity A + C)",
                label: "Business 02 (Entity A + C)",
              },
              {
                value: "Business 03 (Entity A + B2)",
                label: "Business 03 (Entity A + B2)",
              },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Investment Capital (AED)"
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className="text-right font-semibold"
              required
            />
            <Input
              label="Profit Share / Equity Ratio (%)"
              type="number"
              value={equityShare}
              onChange={(e) => setEquityShare(e.target.value)}
              className="text-right font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Contract Governance"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              options={[
                {
                  value: "Standard Contract (Escrow Protected)",
                  label: "Standard Contract (Escrow Protected)",
                },
                {
                  value: "Manual Contract (Special Split)",
                  label: "Manual Contract (Special Split)",
                },
                {
                  value: "Institutional Syndicate Agreement",
                  label: "Institutional Syndicate Agreement",
                },
              ]}
            />
            <Select
              label="Escrow & Settlement Account"
              value={escrowAccount}
              onChange={(e) => setEscrowAccount(e.target.value)}
              options={[
                {
                  value: "Direct Bank Wire (ENBD - DXB Operating Escrow)",
                  label: "Direct Bank Wire (ENBD - DXB Operating Escrow)",
                },
                {
                  value: "ADCB Escrow Account #49281",
                  label: "ADCB Escrow Account #49281",
                },
              ]}
            />
          </div>
        </div>

        {/* 03. SUMMARY LEDGER PREVIEW */}
        <div className="rounded-xl border border-[#d6e3ed] bg-[#edf4f8]/70 p-5 space-y-3">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block">
            03. ALLOCATION SUMMARY PREVIEW
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-700">
              <span>Committed Capital:</span>
              <span className="font-bold text-gray-950">
                AED {investNum.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>Arbitrage Profit Share:</span>
              <span className="font-bold text-gray-950">
                {shareNum}% Contracted
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/investors"
            className="inline-flex items-center justify-center font-semibold transition-colors bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 h-9 px-6 text-xs rounded-md shadow-xs"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            icon={<CheckIcon size={14} />}
            className="px-6 text-xs font-bold"
          >
            Save & Register Investor
          </Button>
        </div>
      </form>
    </div>
  );
}
