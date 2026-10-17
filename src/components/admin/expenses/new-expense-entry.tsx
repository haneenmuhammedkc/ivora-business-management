"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ExpensesIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { ExpenseRecord, ExpenseStatus } from "@/types/expenses";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
}

export interface NewExpenseEntryProps {
  onRecordExpense?: (expense: ExpenseRecord) => void;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NewExpenseEntry({ onRecordExpense }: NewExpenseEntryProps) {
  const router = useRouter();

  // Load active businesses via SWR cache
  const { data: businessesResponse, isLoading: loadingBusinesses } = useCachedFetch<{
    businesses?: BusinessOption[];
    data?: BusinessOption[];
  }>("/api/businesses");

  const businesses: BusinessOption[] = useMemo(() => {
    if (!businessesResponse) return [];
    if (Array.isArray(businessesResponse)) return businessesResponse;
    return businessesResponse.businesses || businessesResponse.data || [];
  }, [businessesResponse]);

  // Form State
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [category, setCategory] = useState<string>("");
  const [currency, setCurrency] = useState<"AED" | "INR">("AED");
  const [amount, setAmount] = useState("");
  const [inrAmount, setInrAmount] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [status, setStatus] = useState<ExpenseStatus>("CLEARED");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeBusinessId = selectedBusinessId || businesses[0]?.id || "";
  const amountNum = Number(amount) || 0;
  const inrAmountNum = Number(inrAmount) || 0;
  const rateNum = Number(conversionRate) || 0;

  // Expense Amount (AED) = Expense Amount (INR) × Conversion Rate (AED per INR)
  const convertedAedAmount = useMemo(() => {
    if (currency !== "INR" || inrAmountNum <= 0 || rateNum <= 0) return 0;
    return Number((inrAmountNum * rateNum).toFixed(2));
  }, [currency, inrAmountNum, rateNum]);

  const effectiveAedAmount = currency === "INR" ? convertedAedAmount : amountNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeBusinessId) {
      setErrorMessage("Please select a business entity.");
      return;
    }

    if (!category.trim()) {
      setErrorMessage("Please enter an expense category.");
      return;
    }

    if (currency === "INR") {
      if (!inrAmountNum || inrAmountNum <= 0) {
        setErrorMessage("Please enter a valid INR expense amount greater than zero.");
        return;
      }
      if (!rateNum || rateNum <= 0) {
        setErrorMessage("Please enter a valid Conversion Rate (AED / INR) greater than zero.");
        return;
      }
    } else {
      if (!amountNum || amountNum <= 0) {
        setErrorMessage("Please enter a valid expense amount greater than zero.");
        return;
      }
    }

    if (!description.trim()) {
      setErrorMessage("Please enter a description or purpose for the expense.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        businessId: activeBusinessId,
        category: category.trim(),
        amount: effectiveAedAmount,
        currency,
        sourceAmount: currency === "INR" ? inrAmountNum : undefined,
        conversionRate: currency === "INR" ? rateNum : undefined,
        expenseDate,
        description: description.trim(),
        paymentMethod: paymentMethod || "Cash",
        status,
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to record expense");
      }

      const createdExpense = json.expense || json.data;

      setSuccessMessage("Expense recorded successfully!");

      if (onRecordExpense && createdExpense) {
        onRecordExpense(createdExpense);
      }

      setTimeout(() => {
        router.push("/expenses");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900">
            <ExpensesIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-950">
                New Expense Entry
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record landed logistics, handling, and trading-level expense allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. CLASSIFICATION & BUSINESS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              01. EXPENSE CLASSIFICATION & BUSINESS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expense Category"
              placeholder="e.g. Delivery & Freight, Labour, Transportation..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />

            <div>
              <Select
                label="Assigned Business Entity"
                value={activeBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                disabled={loadingBusinesses || businesses.length === 0}
                options={
                  loadingBusinesses
                    ? [{ value: "", label: "Loading businesses..." }]
                    : businesses.length === 0
                    ? [{ value: "", label: "No businesses found" }]
                    : businesses.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.code})`,
                      }))
                }
              />
            </div>
          </div>
        </div>

        {/* 02. FINANCIAL DETAILS & DESCRIPTION */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
              02. FINANCIAL DETAILS & DESCRIPTION
            </span>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-medium">
              <span className="text-[11px] text-gray-500 px-1.5 font-medium">Currency:</span>
              <button
                type="button"
                onClick={() => setCurrency("AED")}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  currency === "AED"
                    ? "bg-white text-gray-950 font-bold shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                AED
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  currency === "INR"
                    ? "bg-white text-gray-950 font-bold shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          {currency === "INR" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Expense Amount (INR)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5000.00"
                value={inrAmount}
                onChange={(e) => setInrAmount(e.target.value)}
                className="text-right font-semibold"
                required
              />

              <Input
                label="Conversion Rate (AED / INR)"
                type="number"
                step="any"
                min="0.00000001"
                placeholder="e.g. 0.03624"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                className="text-right font-mono"
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">
                    Amount (AED)
                  </label>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    AUTO
                  </span>
                </div>
                <div className="h-10 px-3.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-end text-xs cursor-default select-none">
                  <span className="font-mono font-bold text-gray-950">
                    AED {convertedAedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount (AED)"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right font-semibold"
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400">
                  Conversion Rate (AED / INR)
                </label>
                <div className="h-10 px-3.5 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center text-xs text-gray-400 select-none">
                  Not required for direct AED expenses
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expense Date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />

            <Select
              label="Payment Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
              options={[
                { value: "CLEARED", label: "Cleared" },
                { value: "PENDING", label: "Pending" },
              ]}
            />
          </div>

          <Input
            label="Description / Purpose"
            placeholder="e.g. Air freight security & customs clearing"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* 03. DISBURSAL & PAYMENT METHOD */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            03. DISBURSAL & PAYMENT METHOD
          </span>

          <Select
            label="Payment & Disbursement Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "Cash", label: "Cash" },
              { value: "Card", label: "Card" },
              { value: "Cheque", label: "Cheque" },
            ]}
            required
          />
        </div>

        {/* 04. SUMMARY PREVIEW */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 text-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block">
            04. SUMMARY PREVIEW
          </span>
          {currency === "INR" ? (
            <div className="space-y-1.5 text-gray-700">
              <div className="flex items-center justify-between">
                <span>Source Amount (INR):</span>
                <span className="font-semibold text-gray-900">
                  ₹ {inrAmountNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Conversion Rate:</span>
                <span className="font-mono text-gray-900">
                  {conversionRate || "—"} AED / INR
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="font-medium text-gray-900">Settled Converted Amount:</span>
                <span className="font-bold text-gray-950 text-sm">
                  AED {effectiveAedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-gray-700">
              <span>Settled Amount:</span>
              <span className="font-bold text-gray-950">
                AED {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/expenses"
            className="inline-flex items-center justify-center font-semibold transition-colors bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 h-9 px-6 text-xs rounded-md shadow-xs"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            icon={<CheckIcon size={14} />}
            className="px-6 text-xs font-bold"
          >
            {submitting ? "Saving..." : "Save & Record Expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}
