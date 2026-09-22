import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { ExpenseSummaryKPIs } from "@/types/expenses";
import { StaggerItem } from "@/components/ui/motion";

export interface ExpenseKpiCardsProps {
  kpis: ExpenseSummaryKPIs;
}

export function ExpenseKpiCards({ kpis }: ExpenseKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-expenses",
      label: "TOTAL EXPENSES",
      currency: "AED",
      value: kpis.totalExpensesAED.toLocaleString(),
    },
    {
      id: "labour-handling",
      label: "LABOUR & HANDLING",
      currency: "AED",
      value: kpis.labourHandlingAED.toLocaleString(),
    },
    {
      id: "freight-logistics",
      label: "FREIGHT & LOGISTICS",
      currency: "AED",
      value: kpis.freightLogisticsAED.toLocaleString(),
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
