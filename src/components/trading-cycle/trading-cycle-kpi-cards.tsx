import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { TradingCycleSummaryKPIs } from "@/types/trading-cycle";
import { StaggerItem } from "@/components/ui/motion";

export interface TradingCycleKpiCardsProps {
  kpis: TradingCycleSummaryKPIs;
}

export function TradingCycleKpiCards({ kpis }: TradingCycleKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-cycles",
      label: "TOTAL CYCLES",
      value: kpis.totalCycles.toString().padStart(2, "0"),
    },
    {
      id: "completed-cycles",
      label: "COMPLETED CYCLES",
      value: kpis.completedCycles.toString().padStart(2, "0"),
    },
    {
      id: "pending-cycles",
      label: "PENDING CYCLES",
      value: kpis.pendingCycles.toString().padStart(2, "0"),
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
