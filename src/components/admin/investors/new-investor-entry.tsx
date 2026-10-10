"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, InvestorsIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateCreateInvestor,
  validateInvestorName,
  validateInvestorEmail,
  validateInvestmentAmount,
  InvestorValidationErrors,
} from "@/validators";

interface BusinessData {
  id: string;
  name: string;
  code: string;
  businessType?: string;
  totalInvestmentAED: number;
}

interface CapacityBreakdown {
  totalInvestmentAED: number;
  adminInvestmentAED: number;
  partnerInvestmentAED: number;
  totalExternalInvestmentAED: number;
  totalCommittedAED: number;
  remainingCapacityAED: number;
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
  const [capacityBreakdown, setCapacityBreakdown] = useState<CapacityBreakdown | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<InvestorValidationErrors>({});
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
          } else {
            setSelectedBusinessId("");
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

  // Fetch detailed capacity breakdown for selected business
  useEffect(() => {
    let isMounted = true;
    if (!selectedBusinessId) {
      return;
    }
    async function loadCapacity() {
      try {
        const res = await fetch(`/api/investors/business/${encodeURIComponent(selectedBusinessId)}`);
        const json = await res.json();
        if (json.success && json.business && isMounted) {
          const b = json.business;
          const totalInv = Number(b.totalInvestmentAED) || 0;
          const adminInv = Number(b.adminInvestmentAED) || 0;
          const partnerInv = Number(b.partnerInvestmentAED) || 0;
          const extInv = Number(b.totalExternalInvestmentAED) || 0;
          const totalCommitted = adminInv + partnerInv + extInv;
          const remaining = Math.max(0, totalInv - totalCommitted);

          setCapacityBreakdown({
            totalInvestmentAED: totalInv,
            adminInvestmentAED: adminInv,
            partnerInvestmentAED: partnerInv,
            totalExternalInvestmentAED: extInv,
            totalCommittedAED: totalCommitted,
            remainingCapacityAED: remaining,
          });
        }
      } catch (err) {
        console.error("Failed to fetch business investor breakdown:", err);
      }
    }
    loadCapacity();
    return () => {
      isMounted = false;
    };
  }, [selectedBusinessId]);

  // Find the selected business record
  const selectedBusiness = useMemo(() => {
    if (!selectedBusinessId) return null;
    return businesses.find((b) => b.id === selectedBusinessId) || null;
  }, [businesses, selectedBusinessId]);

  // Total investment base of the selected business
  const totalInvestmentBase = selectedBusiness ? Number(selectedBusiness.totalInvestmentAED) || 0 : 0;
  const remainingCapacity = capacityBreakdown !== null ? capacityBreakdown.remainingCapacityAED : totalInvestmentBase;

  const enteredAmountNum = useMemo(() => {
    const rawStr = investmentAmount.trim();
    if (!rawStr || !/^\d+(\.\d+)?$/.test(rawStr)) return 0;
    const num = Number(rawStr);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  }, [investmentAmount]);

  const isExceedingCapacity = useMemo(() => {
    if (enteredAmountNum <= 0 || capacityBreakdown === null) return false;
    return enteredAmountNum > remainingCapacity;
  }, [enteredAmountNum, remainingCapacity, capacityBreakdown]);

  // Live equity calculation:
  // Investor Equity % = (Investor Investment Capital / Business.totalInvestmentAED) * 100
  const calculatedEquity = useMemo(() => {
    if (enteredAmountNum <= 0 || totalInvestmentBase <= 0) {
      return "0.00%";
    }
    const ratio = (enteredAmountNum / totalInvestmentBase) * 100;
    if (isNaN(ratio) || !isFinite(ratio) || ratio < 0) {
      return "0.00%";
    }
    return `${ratio.toFixed(2)}%`;
  }, [enteredAmountNum, totalInvestmentBase]);

  /**
   * Helper to scroll and focus to the first invalid field.
   */
  const focusFirstError = (validationErrors: InvestorValidationErrors) => {
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length === 0) return;

    const elementIdMap: Record<string, string> = {
      name: "investorName",
      email: "contactEmail",
      investmentAmount: "investmentCapital",
    };

    for (const key of errorKeys) {
      const targetId = elementIdMap[key];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) {
      const err = validateInvestorName(val);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next.name = err;
        else delete next.name;
        return next;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      const err = validateInvestorEmail(val);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next.email = err;
        else delete next.email;
        return next;
      });
    }
  };

  const handleInvestmentChange = (val: string) => {
    setInvestmentAmount(val);
    if (errors.investmentAmount) {
      const err = validateInvestmentAmount(val);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next.investmentAmount = err;
        else delete next.investmentAmount;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBusiness || !selectedBusiness.id) {
      setErrorMessage("No valid business entity selected. Please select a business from the Investors page first.");
      return;
    }

    const validationResult = validateCreateInvestor({
      name,
      email,
      businessId: selectedBusiness.id,
      investmentCapitalAED: investmentAmount,
    });

    if (!validationResult.isValid || !validationResult.data) {
      setErrors(validationResult.errors);
      focusFirstError(validationResult.errors);
      return;
    }

    if (capacityBreakdown && validationResult.data.investmentAmount > capacityBreakdown.remainingCapacityAED) {
      const errText = `Investment capital (AED ${validationResult.data.investmentAmount.toLocaleString()}) exceeds the business's remaining capacity (AED ${capacityBreakdown.remainingCapacityAED.toLocaleString()}).`;
      setErrors((prev) => ({ ...prev, investmentAmount: errText }));
      setErrorMessage(errText);
      const el = document.getElementById("investmentCapital");
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        router.push(`/investors/business/${encodeURIComponent(selectedBusiness.id)}`);
        router.refresh();
      } else {
        if (data.errors && typeof data.errors === "object") {
          setErrors(data.errors);
          focusFirstError(data.errors);
        }
        const msg = data.message || data.error || "Failed to register investor.";
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("A network error occurred while registering the investor. Please try again.");
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
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[11px] text-red-800">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
              id="investorName"
              label="Investor Name"
              placeholder="e.g. Test External Investor / Alpha Capital"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={errors.name}
              required
            />
            <Input
              id="contactEmail"
              label="Contact Email"
              type="email"
              placeholder="e.g. investor@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={errors.email}
              helperText="Optional: used for contract and distribution communications."
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
              Assigned Business Entity & Investment Capacity
            </label>
            <div
              className={`w-full rounded-lg border bg-gray-50/80 p-3.5 text-xs text-gray-900 space-y-3 ${
                errors.businessId ? "border-red-500" : "border-gray-200"
              }`}
            >
              {isLoadingBusinesses ? (
                <span className="text-gray-400">Loading business information...</span>
              ) : selectedBusiness ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-200/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-950 text-sm">
                        {selectedBusiness.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 rounded">
                        {selectedBusiness.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Total Business Capital:{" "}
                      <strong className="text-gray-900 font-semibold">
                        AED {totalInvestmentBase.toLocaleString()}
                      </strong>
                    </span>
                  </div>

                  {/* Capacity Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                    <div className="p-2 rounded bg-white border border-gray-100">
                      <div className="text-[10px] font-medium text-gray-500 uppercase">Total Capacity</div>
                      <div className="text-xs font-bold text-gray-900 mt-0.5">
                        AED {totalInvestmentBase.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-100">
                      <div className="text-[10px] font-medium text-gray-500 uppercase">Admin + Partner</div>
                      <div className="text-xs font-semibold text-gray-700 mt-0.5">
                        AED {((capacityBreakdown?.adminInvestmentAED || 0) + (capacityBreakdown?.partnerInvestmentAED || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-100">
                      <div className="text-[10px] font-medium text-gray-500 uppercase">External Investors</div>
                      <div className="text-xs font-semibold text-gray-700 mt-0.5">
                        AED {(capacityBreakdown?.totalExternalInvestmentAED || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-2 rounded border ${remainingCapacity > 0 ? "bg-emerald-50/60 border-emerald-200 text-emerald-950" : "bg-red-50/60 border-red-200 text-red-950"}`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Available Capacity</div>
                      <div className="text-xs font-bold mt-0.5">
                        AED {remainingCapacity.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-amber-700 font-medium">
                  No business selected. Please return to the Investors page and select a business first.
                </span>
              )}
            </div>
            {errors.businessId ? (
              <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.businessId}</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1">
                Assigned from your selected business context (read-only).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Investment Capital (AED) - Editable */}
            <div>
              <Input
                id="investmentCapital"
                label="Investment Capital (AED)"
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 25000"
                value={investmentAmount}
                onChange={(e) => handleInvestmentChange(e.target.value)}
                error={errors.investmentAmount}
                className="text-right font-semibold"
                required
              />
              {isExceedingCapacity ? (
                <p className="mt-1 text-[11px] font-semibold text-red-600">
                  Exceeds available capacity! Max allowed: AED {remainingCapacity.toLocaleString()}
                </p>
              ) : enteredAmountNum > 0 && capacityBreakdown !== null ? (
                <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                  Remaining after investment: AED {(remainingCapacity - enteredAmountNum).toLocaleString()}
                </p>
              ) : null}
            </div>

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
