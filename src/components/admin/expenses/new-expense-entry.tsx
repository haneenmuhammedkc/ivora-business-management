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
  const [category, setCategory] = useState<string>("DELIVERY_FREIGHT");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState<ExpenseStatus>("CLEARED");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeBusinessId = selectedBusinessId || businesses[0]?.id || "";
  const amountNum = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeBusinessId) {
      setErrorMessage("Please select a business entity.");
      return;
    }

    if (!amountNum || amountNum <= 0) {
      setErrorMessage("Please enter a valid expense amount greater than zero.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please enter a description or purpose for the expense.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        businessId: activeBusinessId,
        category,
        amount: amountNum,
        expenseDate,
        description: description.trim(),
        paymentMethod: paymentMethod.trim() || null,
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
            <Select
              label="Expense Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "DELIVERY_FREIGHT", label: "Delivery & Freight" },
                { value: "LABOUR_VAULT", label: "Labour & Vault" },
                { value: "PROCESSING_ASSAYING", label: "Processing & Assaying" },
                { value: "INDIA_EXPENSE", label: "India Expense" },
                { value: "TRANSFER_FX_FEES", label: "Transfer & FX Fees" },
                { value: "GENERAL_OVERHEAD", label: "General Overhead" },
              ]}
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
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            02. FINANCIAL DETAILS & DESCRIPTION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* 03. DISBURSAL & PAYMENT METHOD (FREE-FORM TEXT INPUT) */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            03. DISBURSAL & PAYMENT METHOD
          </span>

          <Input
            label="Payment & Disbursement Method"
            placeholder="e.g. Bank Transfer - HDFC, Petty Cash, Cash, Cheque #1042, RTGS Direct"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>

        {/* 04. SUMMARY PREVIEW */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2 text-xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-700 block">
            04. SUMMARY PREVIEW
          </span>
          <div className="flex items-center justify-between text-gray-700">
            <span>Settled Amount:</span>
            <span className="font-bold text-gray-950">
              AED {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
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
