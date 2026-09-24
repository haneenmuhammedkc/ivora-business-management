import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { BusinessesSummaryKPIs } from "@/types/business";
import { StaggerItem } from "@/components/ui/motion";

export interface BusinessKpiCardsProps {
  kpis: BusinessesSummaryKPIs;
}

export function BusinessKpiCards({ kpis }: BusinessKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-businesses",
      label: "TOTAL BUSINESSES",
      value: kpis.totalBusinesses.toString().padStart(2, "0"),
    },
    {
      id: "active-businesses",
      label: "ACTIVE BUSINESSES",
      value: kpis.activeBusinesses.toString().padStart(2, "0"),
    },
    {
      id: "total-partners",
      label: "TOTAL PARTNERS",
      value: kpis.totalPartners.toString().padStart(2, "0"),
    },
    {
      id: "combined-investment",
      label: "COMBINED INVESTMENT",
      currency: "AED",
      value: kpis.combinedInvestmentAED.toLocaleString(),
    },
    {
      id: "combined-net-profit",
      label: "COMBINED NET PROFIT",
      currency: "AED",
      value: kpis.combinedNetProfitAED.toLocaleString(),
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
