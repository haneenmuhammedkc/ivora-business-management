"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ExpenseKpiCards,
  ExpenseFilters,
  ExpenseTableView,
  ExpenseLineageBanner,
  ExpenseDetailsPanel,
  mockExpensesKPIs,
  mockExpensesList,
} from "@/components/admin/expenses";
import { ExpenseRecord } from "@/types/expenses";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(mockExpensesList);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>("EXP-018");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = exp.id.toLowerCase().includes(query);
        const matchesBusiness = exp.business.toLowerCase().includes(query);
        const matchesCategory = exp.category.toLowerCase().includes(query);
        const matchesDesc = exp.description.toLowerCase().includes(query);
        const matchesCycle = exp.cycle.toLowerCase().includes(query);
        const matchesRef = exp.ref.toLowerCase().includes(query);
        if (
          !matchesId &&
          !matchesBusiness &&
          !matchesCategory &&
          !matchesDesc &&
          !matchesCycle &&
          !matchesRef
        ) {
          return false;
        }
      }

      // Business filter
      if (selectedBusiness !== "all" && exp.business !== selectedBusiness) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && exp.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [expenses, searchTerm, selectedBusiness, selectedStatus]);

  // Active selected expense for details panel
  const activeExpense = useMemo(() => {
    return (
      expenses.find((exp) => exp.id === selectedExpenseId) ||
      filteredExpenses[0] ||
      expenses[0]
    );
  }, [expenses, selectedExpenseId, filteredExpenses]);

  // Selection handlers
  const handleSelectExpense = (expense: ExpenseRecord) => {
    setSelectedExpenseId(expense.id);
  };

  const handleToggleSelect = (id: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, selected: !exp.selected } : exp
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredExpenses.length > 0 && filteredExpenses.every((e) => e.selected);
    const filteredIds = new Set(filteredExpenses.map((e) => e.id));
    setExpenses((prev) =>
      prev.map((e) =>
        filteredIds.has(e.id) ? { ...e, selected: !allSelected } : e
      )
    );
  };

  const handleMarkAsCleared = () => {
    setExpenses((prev) =>
      prev.map((e) => (e.selected ? { ...e, status: "CLEARED" } : e))
    );
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Expenses"
          subtitle="Track Trading Expenses, Logistics, Handling Overhead, And Business-Level Allocations."
        />
      </FadeUp>

      {/* KPI Cards (3 Cards in StatCardGrid) */}
      <FadeUp delay={0.1}>
        <ExpenseKpiCards kpis={mockExpensesKPIs} />
      </FadeUp>

      {/* Filter Bar */}
      <FadeUp delay={0.15}>
        <ExpenseFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      </FadeUp>

      {/* Expenses Table */}
      <FadeUp delay={0.2}>
        <ExpenseTableView
          expenses={filteredExpenses}
          selectedExpenseId={selectedExpenseId}
          onSelectExpense={handleSelectExpense}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onMarkAsCleared={handleMarkAsCleared}
          onExportSelected={() => {}}
        />
      </FadeUp>

      {/* Cross-Module Expense & Profit Impact Lineage */}
      <FadeUp delay={0.22}>
        <ExpenseLineageBanner cycleId={activeExpense?.cycle || "TR-0248"} />
      </FadeUp>

      {/* Expense Details Panel */}
      {activeExpense && (
        <FadeUp delay={0.25}>
          <ExpenseDetailsPanel
            expense={activeExpense}
            onClose={() => setSelectedExpenseId("")}
          />
        </FadeUp>
      )}
    </div>
  );
}
