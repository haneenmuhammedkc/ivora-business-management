import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { PurchaseSummaryKPIs } from "@/types/purchase";
import { StaggerItem } from "@/components/ui/motion";

export interface PurchaseKpiCardsProps {
  kpis: PurchaseSummaryKPIs;
}

export function PurchaseKpiCards({ kpis }: PurchaseKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-purchase",
      label: "TOTAL PURCHASE",
      value: kpis.totalPurchase.toString().padStart(2, "0"),
    },
    {
      id: "total-sourcing-cost",
      label: "TOTAL SOURCING COST",
      currency: "AED",
      value: kpis.totalSourcingCostAED.toLocaleString(),
    },
    {
      id: "logistics-overhead",
      label: "LOGISTICS & OVERHEAD",
      currency: "AED",
      value: kpis.logisticsOverheadAED.toLocaleString(),
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
