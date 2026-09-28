"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, InvestorsIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BusinessData {
  id: string;
  name: string;
  code: string;
  businessType?: string;
  totalInvestmentAED: number;
}

export interface NewInvestorEntryProps {
  initialBusinessId?: string;
}

export function NewInvestorEntry({ initialBusinessId }: NewInvestorEntryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBusinessId = searchParams.get("businessId") || initialBusinessId || "";

  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(queryBusinessId);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch businesses to identify the selected business entity and its totalInvestmentAED
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setIsLoadingBusinesses(true);
        const res = await fetch("/api/businesses");
        const json = await res.json();
        if (json.success && Array.isArray(json.businesses)) {
          if (!isMounted) return;
          setBusinesses(json.businesses);
          if (queryBusinessId) {
            setSelectedBusinessId(queryBusinessId);
          } else if (json.businesses.length > 0) {
            setSelectedBusinessId(json.businesses[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load businesses:", err);
      } finally {
        if (isMounted) setIsLoadingBusinesses(false);
      }
    }
    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, [queryBusinessId]);

  // Find the selected business record
  const selectedBusiness = useMemo(() => {
    return businesses.find((b) => b.id === selectedBusinessId) || businesses[0] || null;
  }, [businesses, selectedBusinessId]);

  // Total investment base of the selected business
  const totalInvestmentBase = selectedBusiness ? Number(selectedBusiness.totalInvestmentAED) || 0 : 0;

  // Live equity calculation:
  // Investor Equity % = (Investor Investment Capital / Business.totalInvestmentAED) * 100
  const calculatedEquity = useMemo(() => {
    const investNum = parseFloat(investmentAmount);
    if (isNaN(investNum) || investNum <= 0 || totalInvestmentBase <= 0) {
      return "0.00%";
    }
    const ratio = (investNum / totalInvestmentBase) * 100;
    if (isNaN(ratio) || !isFinite(ratio) || ratio < 0) {
      return "0.00%";
    }
    return `${ratio.toFixed(2)}%`;
  }, [investmentAmount, totalInvestmentBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBusiness) {
      setErrorMessage("No valid business entity selected. Please select a business first.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Please provide the investor's name.");
      return;
    }

    const investVal = parseFloat(investmentAmount);
    if (isNaN(investVal) || investVal <= 0) {
      setErrorMessage("Please enter a valid investment capital amount greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          businessId: selectedBusiness.id,
          investmentCapitalAED: investVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to register investor.");
      }

      router.push(`/investors/business/${encodeURIComponent(selectedBusiness.id)}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register investor";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
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
                EXTERNAL CAPITAL
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Register external investor capital against assigned business total investment.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. INVESTOR PROFILE */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              01. INVESTOR PROFILE & IDENTITY
            </span>
            <span className="text-xs font-mono font-medium text-gray-500">
              Code: Auto-Generated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Investor Name"
              placeholder="e.g. Test External Investor / Alpha Capital"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Contact Email"
              type="email"
              placeholder="e.g. investor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* 02. BUSINESS ALLOCATION & TERMS */}
        <div className="space-y-3.5 pt-5 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            02. ASSIGNED BUSINESS & EQUITY TERMS
          </span>

          {/* Assigned Business Entity - Read-only (NO dropdown) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Assigned Business Entity
            </label>
            <div className="w-full rounded-md border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 text-xs text-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              {isLoadingBusinesses ? (
                <span className="text-gray-400">Loading business information...</span>
              ) : selectedBusiness ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-950 text-sm">
                      {selectedBusiness.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 rounded">
                      {selectedBusiness.code}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Total Investment Base:{" "}
                    <strong className="text-gray-900 font-semibold">
                      AED {totalInvestmentBase.toLocaleString()}
                    </strong>
                  </span>
                </>
              ) : (
                <span className="text-amber-600 font-medium">
                  No business available. Please create a business first.
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Assigned from your selected business context (read-only).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Investment Capital (AED) - Editable */}
            <Input
              label="Investment Capital (AED)"
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 25000"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className="text-right font-semibold"
              required
            />

            {/* Profit Share / Equity Ratio (%) - Read-only, Live calculated */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Profit Share / Equity Ratio (%)
              </label>
              <div className="relative rounded-md shadow-2xs">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={calculatedEquity}
                  className="block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 text-right cursor-not-allowed select-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Calculated as Investment ÷ Total Investment (AED {totalInvestmentBase.toLocaleString()}) × 100
              </p>
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
            disabled={isSubmitting || !selectedBusiness}
            icon={<CheckIcon size={14} />}
            className="px-6 text-xs font-bold"
          >
            {isSubmitting ? "Registering..." : "Save & Register Investor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
