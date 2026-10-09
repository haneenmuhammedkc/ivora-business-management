"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExpensesIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ExpenseRecord, ExpenseStatus } from "@/types/expenses";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
}

export interface EditExpenseEntryProps {
  expenseId: string;
}

function formatDateForInput(dateVal: string | Date | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EditExpenseEntry({ expenseId }: EditExpenseEntryProps) {
  const router = useRouter();

  // Businesses state
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Existing expense record state
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [expenseCode, setExpenseCode] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  // Form State
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [status, setStatus] = useState<ExpenseStatus>("PENDING");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const amountNum = Number(amount) || 0;

  // Load real businesses from database
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        setLoadingBusinesses(true);
        const res = await fetch("/api/businesses");
        if (!res.ok) {
          throw new Error(`Failed to load businesses (${res.status})`);
        }
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.businesses)) {
          setBusinesses(
            data.businesses.map((b: { id: string; name: string; code: string }) => ({
              id: b.id,
              name: b.name,
              code: b.code,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching businesses:", err);
      } finally {
        if (isMounted) setLoadingBusinesses(false);
      }
    }
    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load existing expense record
  useEffect(() => {
    let isMounted = true;
    async function loadExpense() {
      try {
        setLoadingRecord(true);
        setErrorMessage(null);
        const res = await fetch(`/api/expenses/${expenseId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || "Failed to load expense details");
        }

        const exp: ExpenseRecord = data.expense || data.data;
        if (isMounted && exp) {
          setExpenseCode(exp.expenseCode || "");
          setSelectedBusinessId(exp.businessId || "");
          setCategory(exp.category || "");
          setAmount(exp.amount !== undefined && exp.amount !== null ? String(exp.amount) : "");
          setExpenseDate(formatDateForInput(exp.expenseDate || exp.date));
          setDescription(exp.description || "");

          // Normalize payment method to Cash, Card, or Cheque if valid; default Cash
          const pm = exp.paymentMethod || "Cash";
          if (["Cash", "Card", "Cheque"].includes(pm)) {
            setPaymentMethod(pm);
          } else {
            setPaymentMethod("Cash");
          }

          setStatus(exp.status || "CLEARED");

          // Financial Immutability check
          if (exp.status === "CLEARED") {
            setIsLocked(true);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load expense record.";
        setErrorMessage(msg);
      } finally {
        if (isMounted) setLoadingRecord(false);
      }
    }
    loadExpense();
    return () => {
      isMounted = false;
    };
  }, [expenseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isLocked) {
      setErrorMessage("Cleared expenses are finalized and immutable. Modifications are prohibited.");
      return;
    }

    if (!selectedBusinessId) {
      setErrorMessage("Please select a business entity.");
      return;
    }

    if (!category.trim()) {
      setErrorMessage("Please enter an expense category.");
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
        businessId: selectedBusinessId,
        category: category.trim(),
        amount: amountNum,
        expenseDate,
        description: description.trim(),
        paymentMethod: paymentMethod || "Cash",
        status,
      };

      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Failed to update expense");
      }

      setSuccessMessage("Expense updated successfully! Returning to expense list...");

      setTimeout(() => {
        router.push("/expenses");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const businessOptions = useMemo(() => {
    return [
      { value: "", label: loadingBusinesses ? "Loading businesses..." : "Select Business" },
      ...businesses.map((b) => ({
        value: b.id,
        label: `${b.name} (${b.code})`,
      })),
    ];
  }, [businesses, loadingBusinesses]);

  if (loadingRecord) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-500 shadow-2xs">
        Loading expense record...
      </div>
    );
  }

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
                Edit Expense
              </h2>
              {expenseCode && (
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-gray-900 bg-gray-100 border border-gray-300 rounded">
                  {expenseCode}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Update landed logistics, handling, and trading-level expense allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Financial Immutability Notice Banner */}
      {isLocked && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <span className="font-bold">🔒 Financial Lock:</span>
          <span>
            This expense is marked as <strong>CLEARED</strong> and is financially finalized. Modifications are prohibited to preserve ledger integrity.
          </span>
        </div>
      )}

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
              disabled={isLocked || submitting}
              required
            />

            <div>
              <Select
                label="Assigned Business Entity"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                disabled={loadingBusinesses || isLocked || submitting}
                options={businessOptions}
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
              disabled={isLocked || submitting}
              required
            />

            <Input
              label="Expense Date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              disabled={isLocked || submitting}
              required
            />

            <Select
              label="Payment Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
              disabled={isLocked || submitting}
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
            disabled={isLocked || submitting}
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
            disabled={isLocked || submitting}
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
          {!isLocked && (
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="px-6 text-xs font-bold"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
