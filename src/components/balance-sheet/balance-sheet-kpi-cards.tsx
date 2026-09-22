import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { BalanceSheetSummaryKPIs } from "@/types/balance-sheet";
import { StaggerItem } from "@/components/ui/motion";

export interface BalanceSheetKpiCardsProps {
  kpis: BalanceSheetSummaryKPIs;
}

export function BalanceSheetKpiCards({ kpis }: BalanceSheetKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-assets",
      label: "TOTAL ASSETS",
      currency: "AED",
      value: kpis.totalAssetsAED.toLocaleString(),
    },
    {
      id: "total-liabilities",
      label: "TOTAL LIABILITIES",
      currency: "AED",
      value: kpis.totalLiabilitiesAED.toLocaleString(),
    },
    {
      id: "total-equity",
      label: "TOTAL EQUITY",
      currency: "AED",
      value: kpis.totalEquityAED.toLocaleString(),
    },
    {
      id: "balance-check",
      variant: "highlight",
      label: "BALANCE CHECK",
      value: kpis.balanceCheckAED === 0 ? "Balanced" : `AED ${kpis.balanceCheckAED.toLocaleString()}`,
      description: "Assets = Liab + Equity",
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
