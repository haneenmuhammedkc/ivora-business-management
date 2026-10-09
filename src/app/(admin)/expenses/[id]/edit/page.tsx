import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { EditExpenseEntry } from "@/components/admin/expenses";

export const metadata = {
  title: "Edit Expense - Ivora",
  description: "Update landed logistics, handling, and trading-level expense allocations.",
};

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params;

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

      {/* Main Edit Expense Form */}
      <FadeUp delay={0.1}>
        <EditExpenseEntry expenseId={id} />
      </FadeUp>
    </div>
  );
}
