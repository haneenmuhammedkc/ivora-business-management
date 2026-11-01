"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, XIcon, InvestorsIcon } from "@/components/ui/icons";
import { InvestorRecord } from "@/types/investors";
import {
  validateInvestorName,
  validateInvestorEmail,
  validateInvestorPhone,
  validateInvestmentAmount,
  parseWeightQuantity,
  InvestorValidationErrors,
} from "@/validators/investor.validator";

export interface EditInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: InvestorRecord;
  onSuccess?: () => void;
}

interface CapacityBreakdown {
  totalInvestmentAED: number;
  adminInvestmentAED: number;
  partnerInvestmentAED: number;
  totalExternalInvestmentAED: number;
  totalCommittedAED: number;
  remainingCapacityAED: number;
}

export function EditInvestorModal(props: EditInvestorModalProps) {
  if (!props.isOpen) return null;
  return <EditInvestorModalContent {...props} />;
}

function EditInvestorModalContent({
  onClose,
  investor,
  onSuccess,
}: EditInvestorModalProps) {
  const [name, setName] = useState(investor.name || "");
  const [email, setEmail] = useState(investor.email || "");
  const [phone, setPhone] = useState(investor.phone || "");

  const initialHasWeight = Boolean(investor.allocatedGrams && investor.allocatedGrams > 0);
  const [entryBasis, setEntryBasis] = useState<"AMOUNT" | "WEIGHT">(initialHasWeight ? "WEIGHT" : "AMOUNT");
  const [investmentAmount, setInvestmentAmount] = useState(
    String(investor.investmentAED || "")
  );
  const [quantityGms, setQuantityGms] = useState(
    investor.allocatedGrams ? String(investor.allocatedGrams) : ""
  );
  const [ratePerGm, setRatePerGm] = useState(() => {
    if (investor.allocatedGrams && investor.allocatedGrams > 0 && investor.investmentAED > 0) {
      return String(Number((investor.investmentAED / investor.allocatedGrams).toFixed(2)));
    }
    return "";
  });

  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    investor.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
  );

  const [capacityBreakdown, setCapacityBreakdown] = useState<CapacityBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<InvestorValidationErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch business capacity breakdown
  useEffect(() => {
    let isMounted = true;
    if (!investor.businessId) return;

    async function loadCapacity() {
      try {
        const res = await fetch(`/api/investors/business/${encodeURIComponent(investor.businessId!)}`);
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
        console.error("Failed to load business capacity breakdown:", err);
      }
    }

    loadCapacity();
    return () => {
      isMounted = false;
    };
  }, [investor.businessId]);

  // Financial calculations
  const businessTotalInvestment = capacityBreakdown?.totalInvestmentAED ?? 0;
  const currentInvestorCommitted = investor.investmentAED || 0;
  
  // Other external commitments excluding current investor
  const otherCommitments = useMemo(() => {
    if (!capacityBreakdown) return 0;
    const adminPartner = capacityBreakdown.adminInvestmentAED + capacityBreakdown.partnerInvestmentAED;
    const otherExt = Math.max(0, capacityBreakdown.totalExternalInvestmentAED - currentInvestorCommitted);
    return adminPartner + otherExt;
  }, [capacityBreakdown, currentInvestorCommitted]);

  const maxAllowedForThisInvestor = useMemo(() => {
    if (!capacityBreakdown) return currentInvestorCommitted;
    return Math.max(0, businessTotalInvestment - otherCommitments);
  }, [capacityBreakdown, businessTotalInvestment, otherCommitments, currentInvestorCommitted]);

  const enteredAmountNum = useMemo(() => {
    const rawStr = investmentAmount.trim();
    if (!rawStr || !/^\d+(\.\d+)?$/.test(rawStr)) return 0;
    const num = Number(rawStr);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  }, [investmentAmount]);

  const derivedCapitalFromWeight = useMemo(() => {
    const qStr = quantityGms.trim();
    const rStr = ratePerGm.trim();
    if (!qStr || !rStr) return 0;
    const qNum = Number(qStr);
    const rNum = Number(rStr);
    if (isNaN(qNum) || isNaN(rNum) || qNum <= 0 || rNum <= 0) return 0;
    return Math.round(qNum * rNum * 100) / 100;
  }, [quantityGms, ratePerGm]);

  const effectiveCapitalNum = useMemo(() => {
    return entryBasis === "WEIGHT" ? derivedCapitalFromWeight : enteredAmountNum;
  }, [entryBasis, derivedCapitalFromWeight, enteredAmountNum]);

  const isExceedingCapacity = useMemo(() => {
    if (effectiveCapitalNum <= 0 || !capacityBreakdown) return false;
    return effectiveCapitalNum > maxAllowedForThisInvestor;
  }, [effectiveCapitalNum, maxAllowedForThisInvestor, capacityBreakdown]);

  // Live equity ratio calculation
  const calculatedEquity = useMemo(() => {
    if (effectiveCapitalNum <= 0 || businessTotalInvestment <= 0) {
      return "0.00%";
    }
    const ratio = (effectiveCapitalNum / businessTotalInvestment) * 100;
    if (isNaN(ratio) || !isFinite(ratio) || ratio < 0) {
      return "0.00%";
    }
    return `${ratio.toFixed(2)}%`;
  }, [effectiveCapitalNum, businessTotalInvestment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationErrors: InvestorValidationErrors = {};

    // Validate Name
    const nameErr = validateInvestorName(name);
    if (nameErr) validationErrors.name = nameErr;

    // Validate Email
    if (email) {
      const emailErr = validateInvestorEmail(email);
      if (emailErr) validationErrors.email = emailErr;
    }

    // Validate Phone
    if (phone) {
      const phoneErr = validateInvestorPhone(phone);
      if (phoneErr) validationErrors.phone = phoneErr;
    }

    // Validate Amount / Weight
    if (entryBasis === "WEIGHT") {
      const qRes = parseWeightQuantity(quantityGms, "Weight in grams");
      if (qRes.error) validationErrors.quantityGms = qRes.error;

      const rErr = validateInvestmentAmount(ratePerGm);
      if (rErr) validationErrors.ratePerGm = rErr;

      if (!qRes.error && !rErr && derivedCapitalFromWeight <= 0) {
        validationErrors.investmentAmount = "Derived investment capital must be greater than 0.";
      }
    } else {
      const amountErr = validateInvestmentAmount(investmentAmount);
      if (amountErr) {
        validationErrors.investmentAmount = amountErr;
      }
    }

    if (isExceedingCapacity) {
      validationErrors.investmentAmount = `Amount exceeds available capacity. Max allowed: AED ${maxAllowedForThisInvestor.toLocaleString()}`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        investmentAmount: effectiveCapitalNum,
        status,
        entryBasis,
        allocatedGrams: entryBasis === "WEIGHT" ? Number(quantityGms) : null,
      };

      const res = await fetch(`/api/investors/${encodeURIComponent(investor.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        onSuccess?.();
        onClose();
      } else {
        if (data.errors && typeof data.errors === "object") {
          setErrors(data.errors);
        }
        const msg = data.message || data.error || "Failed to update investor details.";
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("A network error occurred while updating the investor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
              <InvestorsIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-950">
                  Edit Investor Profile
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded uppercase">
                  {investor.code || "EXTERNAL"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Update investor credentials, investment capital, and active participation status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[11px] text-red-800">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Identity Fields */}
          <div className="space-y-3.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
              01. INVESTOR PROFILE & CREDENTIALS
            </span>

            <Input
              id="editInvestorName"
              label="Investor Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="editInvestorEmail"
                label="Contact Email"
                type="email"
                placeholder="e.g. investor@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
              />
              <Input
                id="editInvestorPhone"
                label="Phone Number"
                placeholder="e.g. +971 501234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
              />
            </div>
          </div>

          {/* Investment Capital & Terms */}
          <div className="space-y-3.5 pt-4 border-t border-gray-100">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
              02. CAPITAL ALLOCATION & CAPACITY
            </span>

            {/* Capacity Status Box */}
            {capacityBreakdown && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Business Total Capacity:</span>
                  <span className="font-semibold text-gray-900">
                    AED {businessTotalInvestment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Max Allowed For This Investor:</span>
                  <span className="font-bold text-gray-950">
                    AED {maxAllowedForThisInvestor.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Entry Mode Toggle */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Contribution Basis
              </label>
              <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setEntryBasis("AMOUNT")}
                  className={`py-1 px-3 text-xs font-semibold rounded-md transition-all ${
                    entryBasis === "AMOUNT"
                      ? "bg-white text-gray-950 shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Amount (AED)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryBasis("WEIGHT")}
                  className={`py-1 px-3 text-xs font-semibold rounded-md transition-all ${
                    entryBasis === "WEIGHT"
                      ? "bg-white text-gray-950 shadow-2xs font-bold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Weight (Grams)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {entryBasis === "AMOUNT" ? (
                <div>
                  <Input
                    id="editInvestmentAmount"
                    label="Investment Capital (AED)"
                    type="number"
                    step="any"
                    min="1"
                    value={investmentAmount}
                    onChange={(e) => {
                      setInvestmentAmount(e.target.value);
                      if (errors.investmentAmount) {
                        setErrors((prev) => ({ ...prev, investmentAmount: undefined }));
                      }
                    }}
                    error={errors.investmentAmount}
                    className="text-right font-semibold"
                    required
                  />
                  {isExceedingCapacity ? (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      Exceeds max allowed (AED {maxAllowedForThisInvestor.toLocaleString()})
                    </p>
                  ) : effectiveCapitalNum > 0 && capacityBreakdown ? (
                    <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                      Available remaining: AED {(maxAllowedForThisInvestor - effectiveCapitalNum).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="editQuantityGms"
                      label="Weight (g)"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={quantityGms}
                      onChange={(e) => {
                        setQuantityGms(e.target.value);
                        if (errors.quantityGms) setErrors((prev) => ({ ...prev, quantityGms: undefined }));
                      }}
                      error={errors.quantityGms}
                      className="text-right font-semibold"
                      required
                    />
                    <Input
                      id="editRatePerGm"
                      label="Rate (AED/g)"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={ratePerGm}
                      onChange={(e) => {
                        setRatePerGm(e.target.value);
                        if (errors.ratePerGm) setErrors((prev) => ({ ...prev, ratePerGm: undefined }));
                      }}
                      error={errors.ratePerGm}
                      className="text-right font-semibold"
                      required
                    />
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200 text-[11px] flex justify-between">
                    <span className="text-gray-500">Derived:</span>
                    <span className="font-bold text-gray-900">AED {derivedCapitalFromWeight.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Calculated Profit Share (%)
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
                <p className="mt-1 text-[11px] text-gray-400">
                  Calculated against business total capital
                </p>
              </div>
            </div>

            {/* Status Field */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Participation Status
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800">
                  <input
                    type="radio"
                    name="investorStatus"
                    value="ACTIVE"
                    checked={status === "ACTIVE"}
                    onChange={() => setStatus("ACTIVE")}
                    className="text-black focus:ring-black h-3.5 w-3.5"
                  />
                  <span>ACTIVE (Participating in current distributions)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-500">
                  <input
                    type="radio"
                    name="investorStatus"
                    value="INACTIVE"
                    checked={status === "INACTIVE"}
                    onChange={() => setStatus("INACTIVE")}
                    className="text-black focus:ring-black h-3.5 w-3.5"
                  />
                  <span>INACTIVE</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              icon={<CheckIcon size={14} />}
              className="text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
