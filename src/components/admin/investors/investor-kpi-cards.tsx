import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { InvestorSummaryKPIs } from "@/types/investors";
import { StaggerItem } from "@/components/ui/motion";

export interface InvestorKpiCardsProps {
  kpis: InvestorSummaryKPIs;
}

export function InvestorKpiCards({ kpis }: InvestorKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-investors",
      label: "TOTAL INVESTORS",
      value: kpis.totalInvestors.toString().padStart(2, "0"),
    },
    {
      id: "total-investment",
      label: "TOTAL INVESTMENT",
      currency: "AED",
      value: kpis.totalInvestmentAED.toLocaleString(),
    },
    {
      id: "profit-paid",
      label: "PROFIT PAID",
      value: kpis.profitPaid.toString().padStart(2, "0"),
    },
    {
      id: "net-realized-profit",
      variant: "highlight",
      label: "NET REALIZED PROFIT",
      currency: "AED",
      value: kpis.netRealizedProfitAED.toLocaleString(),
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
