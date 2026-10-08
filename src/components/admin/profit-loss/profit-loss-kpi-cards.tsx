import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { ProfitLossSummaryKPIs } from "@/types/profit-loss";
import { StaggerItem } from "@/components/ui/motion";

export interface ProfitLossKpiCardsProps {
  kpis?: ProfitLossSummaryKPIs;
}

export function ProfitLossKpiCards({ kpis }: ProfitLossKpiCardsProps) {
  const totalSales = kpis?.totalSalesAED ?? 0;
  const purchaseCost = kpis?.purchaseCostAED ?? 0;
  const totalExpenses = kpis?.totalExpensesAED ?? 0;
  const grossProfit = kpis?.grossProfitAED ?? 0;
  const netProfit = kpis?.netProfitAED ?? 0;

  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-sales",
      label: "TOTAL SALES",
      currency: "AED",
      value: totalSales.toLocaleString(),
    },
    {
      id: "purchase-cost",
      label: "PURCHASE COST",
      currency: "AED",
      value: purchaseCost.toLocaleString(),
    },
    {
      id: "total-expenses",
      label: "TOTAL EXPENSES",
      currency: "AED",
      value: totalExpenses.toLocaleString(),
    },
    {
      id: "gross-profit",
      label: "GROSS PROFIT",
      currency: "AED",
      value: grossProfit.toLocaleString(),
    },
    {
      id: "net-profit",
      variant: "highlight",
      label: "NET PROFIT",
      currency: "AED",
      value: netProfit.toLocaleString(),
    },
  ];

  return (
    <StatCardGrid>
      {stats.map((stat) => (
        <StaggerItem key={stat.id}>
          <StatCard
            label={stat.label}
            value={stat.value}
            currency={stat.currency}
            variant={stat.variant}
            description={stat.description}
          />
        </StaggerItem>
      ))}
    </StatCardGrid>
  );
}
