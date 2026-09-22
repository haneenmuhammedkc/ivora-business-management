import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { NewExpenseEntry } from "@/components/expenses";

export const metadata = {
  title: "New Expense Entry - Ivora",
  description: "Record landed logistics, handling, and trading-level expense allocations.",
};

export default function NewExpensePage() {
  return (
    <div className="space-y-6 pb-14 max-w-5xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Expenses</span>
          </Link>
        </div>
      </FadeUp>

      {/* Main New Expense Form */}
      <FadeUp delay={0.1}>
        <NewExpenseEntry />
      </FadeUp>
    </div>
  );
}
