"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ExpenseKpiCards,
  ExpenseFilters,
  ExpenseTableView,
  ExpenseDetailsPanel,
} from "@/components/admin/expenses";
import { ExpenseRecord, ExpenseSummaryKPIs, getExpenseBusinessName } from "@/types/expenses";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

interface BusinessOption {
  id: string;
  name: string;
  code: string;
}

export default function ExpensesPage() {
  // Query Filters State
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // UI Selection State
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dynamic API Fetch with SWR Cache
  const expensesApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedBusiness !== "all") params.set("businessId", selectedBusiness);
    const qs = params.toString();
    return qs ? `/api/expenses?${qs}` : "/api/expenses";
  }, [selectedBusiness]);

  const {
    data: expensesResponse,
    isLoading: loadingExpenses,
    mutate: mutateExpenses,
  } = useCachedFetch<{ expenses?: ExpenseRecord[]; data?: ExpenseRecord[] }>(expensesApiUrl);

  const { data: businessesResponse } = useCachedFetch<{
    businesses?: BusinessOption[];
    data?: BusinessOption[];
  }>("/api/businesses");

  const rawExpenses: ExpenseRecord[] = useMemo(() => {
    if (!expensesResponse) return [];
    if (Array.isArray(expensesResponse)) return expensesResponse;
    return expensesResponse.expenses || expensesResponse.data || [];
  }, [expensesResponse]);

  const businesses: BusinessOption[] = useMemo(() => {
    if (!businessesResponse) return [];
    if (Array.isArray(businessesResponse)) return businessesResponse;
    return businessesResponse.businesses || businessesResponse.data || [];
  }, [businessesResponse]);

  // Business options for filter dropdown
  const businessOptions = useMemo(() => {
    return businesses.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.code})`,
    }));
  }, [businesses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return rawExpenses
      .map((exp) => ({
        ...exp,
        selected: selectedIds.has(exp.id),
      }))
      .filter((exp) => {
        // Status filter
        if (selectedStatus !== "all" && exp.status !== selectedStatus) {
          return false;
        }

        // Category filter
        if (selectedCategory !== "all" && exp.category !== selectedCategory) {
          return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesCode = (exp.expenseCode || exp.id || "").toLowerCase().includes(query);
          const matchesBusiness = getExpenseBusinessName(exp).toLowerCase().includes(query);
          const matchesCategory = (exp.category || "").toLowerCase().includes(query);
          const matchesDesc = (exp.description || "").toLowerCase().includes(query);
          const matchesPayment = (exp.paymentMethod || "").toLowerCase().includes(query);

          if (
            !matchesCode &&
            !matchesBusiness &&
            !matchesCategory &&
            !matchesDesc &&
            !matchesPayment
          ) {
            return false;
          }
        }

        return true;
      });
  }, [rawExpenses, selectedIds, selectedStatus, selectedCategory, searchTerm]);

  // Compute live KPIs from loaded expenses
  const kpis: ExpenseSummaryKPIs = useMemo(() => {
    let total = 0;
    let labour = 0;
    let freight = 0;

    for (const exp of rawExpenses) {
      const amt = Number(exp.amount ?? exp.amountAED ?? 0);
      total += amt;
      if (exp.category === "LABOUR_VAULT" || exp.category === "Labour" || exp.category === "Labour & Vault") {
        labour += amt;
      }
      if (
        exp.category === "DELIVERY_FREIGHT" ||
        exp.category === "Delivery & Freight" ||
        exp.category === "Delivery / Transport"
      ) {
        freight += amt;
      }
    }

    return {
      totalExpensesAED: total,
      labourHandlingAED: labour,
      freightLogisticsAED: freight,
    };
  }, [rawExpenses]);

  // Active selected expense for details panel
  const activeExpense = useMemo(() => {
    if (!selectedExpenseId) return null;
    return filteredExpenses.find((exp) => exp.id === selectedExpenseId) || null;
  }, [filteredExpenses, selectedExpenseId]);

  // Selection handlers
  const handleSelectExpense = (expense: ExpenseRecord) => {
    setSelectedExpenseId((prev) => (prev === expense.id ? "" : expense.id));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredSelected =
      filteredExpenses.length > 0 &&
      filteredExpenses.every((e) => selectedIds.has(e.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const e of filteredExpenses) next.delete(e.id);
      } else {
        for (const e of filteredExpenses) next.add(e.id);
      }
      return next;
    });
  };

  const handleMarkAsCleared = async () => {
    if (selectedIds.size === 0) return;

    try {
      const idsToUpdate = Array.from(selectedIds);
      await Promise.all(
        idsToUpdate.map((id) =>
          fetch(`/api/expenses/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CLEARED" }),
          })
        )
      );
      setSelectedIds(new Set());
      await mutateExpenses();
    } catch (err) {
      console.error("Failed to update expense status:", err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedExpenseId === id) setSelectedExpenseId("");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await mutateExpenses();
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
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
        <ExpenseKpiCards kpis={kpis} />
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
          selectedProduct={selectedCategory}
          onProductChange={setSelectedCategory}
          businessOptions={businessOptions}
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
          onMarkAsCleared={selectedIds.size > 0 ? handleMarkAsCleared : undefined}
          onExportSelected={() => {}}
          loading={loadingExpenses}
        />
      </FadeUp>

      {/* Expense Details Panel */}
      {activeExpense && (
        <FadeUp delay={0.25}>
          <ExpenseDetailsPanel
            expense={activeExpense}
            onClose={() => setSelectedExpenseId("")}
            onDelete={handleDeleteExpense}
          />
        </FadeUp>
      )}
    </div>
  );
}
