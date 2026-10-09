"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  ExpenseKpiCards,
  ExpenseFilters,
  ExpenseTableView,
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

  // Dynamically generated category options based on existing expenses in database
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const exp of rawExpenses) {
      if (exp.category && exp.category.trim()) {
        set.add(exp.category.trim());
      }
    }
    const sorted = Array.from(set).sort();
    return [
      { value: "all", label: "All Categories" },
      ...sorted.map((cat) => ({
        value: cat,
        label: cat.replace(/_/g, " "),
      })),
    ];
  }, [rawExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return rawExpenses.filter((exp) => {
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
  }, [rawExpenses, selectedStatus, selectedCategory, searchTerm]);

  // Compute live KPIs from loaded expenses
  const kpis: ExpenseSummaryKPIs = useMemo(() => {
    let total = 0;
    let labour = 0;
    let freight = 0;

    for (const exp of rawExpenses) {
      const amt = Number(exp.amount ?? exp.amountAED ?? 0);
      total += amt;
      const catLower = (exp.category || "").toLowerCase();
      if (catLower.includes("labour") || catLower.includes("vault")) {
        labour += amt;
      }
      if (catLower.includes("delivery") || catLower.includes("freight") || catLower.includes("transport")) {
        freight += amt;
      }
    }

    return {
      totalExpensesAED: total,
      labourHandlingAED: labour,
      freightLogisticsAED: freight,
    };
  }, [rawExpenses]);

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
          categoryOptions={categoryOptions}
        />
      </FadeUp>

      {/* Expenses Table */}
      <FadeUp delay={0.2}>
        <ExpenseTableView
          expenses={filteredExpenses}
          loading={loadingExpenses}
        />
      </FadeUp>
    </div>
  );
}
