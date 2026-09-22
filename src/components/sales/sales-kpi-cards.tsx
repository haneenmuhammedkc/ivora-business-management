import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { SalesSummaryKPIs } from "@/types/sales";
import { StaggerItem } from "@/components/ui/motion";

export interface SalesKpiCardsProps {
  kpis: SalesSummaryKPIs;
}

export function SalesKpiCards({ kpis }: SalesKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-sales",
      label: "TOTAL SALES",
      value: kpis.totalSales.toString().padStart(2, "0"),
    },
    {
      id: "india-sales-value",
      label: "INDIA SALES VALUE",
      currency: "AED",
      value: kpis.indiaSalesValueAED.toLocaleString(),
    },
    {
      id: "logistics-overhead",
      label: "LOGISTICS & OVERHEAD",
      currency: "AED",
      value: kpis.logisticsOverheadAED.toLocaleString(),
    },
    {
      id: "gross-profit",
      variant: "highlight",
      label: "GROSS PROFIT",
      currency: "AED",
      value: kpis.grossProfitAED.toLocaleString(),
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
