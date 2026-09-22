import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { ProfitLossSummaryKPIs } from "@/types/profit-loss";
import { StaggerItem } from "@/components/ui/motion";

export interface ProfitLossKpiCardsProps {
  kpis: ProfitLossSummaryKPIs;
}

export function ProfitLossKpiCards({ kpis }: ProfitLossKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-sales",
      label: "TOTAL SALES",
      currency: "AED",
      value: kpis.totalSalesAED.toLocaleString(),
    },
    {
      id: "purchase-cost",
      label: "PURCHASE COST",
      currency: "AED",
      value: kpis.purchaseCostAED.toLocaleString(),
    },
    {
      id: "total-expenses",
      label: "TOTAL EXPENSES",
      currency: "AED",
      value: kpis.totalExpensesAED.toLocaleString(),
    },
    {
      id: "gross-profit",
      label: "GROSS PROFIT",
      currency: "AED",
      value: kpis.grossProfitAED.toLocaleString(),
    },
    {
      id: "net-profit",
      variant: "highlight",
      label: "NET PROFIT",
      currency: "AED",
      value: kpis.netProfitAED.toLocaleString(),
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
