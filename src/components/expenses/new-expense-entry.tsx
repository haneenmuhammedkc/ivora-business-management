"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ExpensesIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ExpenseRecord, ExpenseCategory, ExpenseStatus } from "@/types/expenses";

export interface NewExpenseEntryProps {
  onRecordExpense?: (expense: ExpenseRecord) => void;
}

export function NewExpenseEntry({ onRecordExpense }: NewExpenseEntryProps) {
  const router = useRouter();

  const [category, setCategory] = useState<ExpenseCategory>("Delivery / Transport");
  const [business, setBusiness] = useState("Business 01 (Entity A + B)");
  const [tradingCycle, setTradingCycle] = useState("TR-0248");
  const [amount, setAmount] = useState("450.00");
  const [date, setDate] = useState("10 Sep 2026");
  const [referenceCode, setReferenceCode] = useState("DEL-8822");
  const [description, setDescription] = useState("Air freight security & customs clearing");
  const [paymentMethod, setPaymentMethod] = useState("Main Admin via Bank Wire");

  const amountNum = Number(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newExpense: ExpenseRecord = {
      id: "EXP-024",
      business: business.split(" (")[0] || "Business 01",
      businessEntity: business.includes("(") ? business.split("(")[1].replace(")", "") : "Entity A+B",
      entityLabel: `${business}`,
      date,
      category,
      description,
      cycle: tradingCycle,
      ref: referenceCode,
      amountAED: amountNum,
      status: "CLEARED" as ExpenseStatus,
      selected: false,
      details: {
        settledAmount: amountNum,
        settlementCurrency: "AED (United Arab Emirates Dirham)",
        disbursedBy: paymentMethod,
        expenseClassification: category,
        cycleAllocation: `Trading Cycle ${tradingCycle}`,
        cycleCategoryDistribution: {
          deliveryFreight: 1150.0,
          labourVault: 850.0,
          processingAssaying: 1200.0,
          indiaRealizationExp: 4000.0,
          transferFxFees: 1650.0,
        },
        cycleMarginalImpact: {
          cycleGrossSpread: 30000.0,
          thisRecord: -amountNum,
          totalCycleExpenses: -6000.0,
          netCycleProfit: 24000.0,
          netCycleMargin: 16.9,
        },
        linkedContracts: {
          purchaseId: "PR-0248",
          purchaseCostAED: 112000,
          saleId: "SL-0248",
          saleRealizationAED: 142000,
          cycleId: tradingCycle,
          cycleStatus: "Completed",
        },
      },
    };

    if (onRecordExpense) {
      onRecordExpense(newExpense);
    }
    router.push("/expenses");
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 01. CLASSIFICATION & BUSINESS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">
              01. EXPENSE CLASSIFICATION & BUSINESS
            </span>
            <span className="text-xs font-mono font-bold text-gray-900">
              ID: EXP-024
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Expense Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              options={[
                { value: "Delivery / Transport", label: "Delivery / Transport" },
                { value: "Labour", label: "Labour" },
                { value: "Other Expense", label: "Other Expense" },
                { value: "India Expense", label: "India Expense" },
                { value: "Transfer / Conversion", label: "Transfer / Conversion" },
              ]}
            />
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
              ]}
            />
          </div>

          <Select
            label="Linked Trading Cycle"
            value={tradingCycle}
            onChange={(e) => setTradingCycle(e.target.value)}
            options={[
              { value: "TR-0248", label: "TR-0248 (Dubai Gold Souk ↔ Mumbai Vault)" },
              { value: "TR-0247", label: "TR-0247 (Dubai Gold Souk ↔ Zaveri Bazaar)" },
              { value: "TR-0246", label: "TR-0246 (Pure Bullion Transit)" },
            ]}
          />
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-right font-semibold"
              required
            />
            <Input
              label="Expense Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Reference Code"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              required
            />
          </div>

          <Input
            label="Description / Purpose"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* 03. DISBURSAL & PAYMENT METHOD */}
        <div className="space-y-3.5 pt-2 border-t border-gray-100">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 block">
            03. DISBURSAL & SETTLEMENT METHOD
          </span>

          <Select
            label="Payment & Disbursal Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "Main Admin via Bank Wire", label: "Main Admin via Bank Wire" },
              { value: "Main Admin via Cash Voucher", label: "Main Admin via Cash Voucher" },
              { value: "Main Admin via RTGS Direct", label: "Main Admin via RTGS Direct" },
            ]}
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
              AED {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-700">
            <span>Cycle Allocation:</span>
            <span className="font-semibold text-gray-900">
              Trading Cycle {tradingCycle}
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
            icon={<CheckIcon size={14} />}
            className="px-6 text-xs font-bold"
          >
            Save & Record Expense
          </Button>
        </div>
      </form>
    </div>
  );
}
