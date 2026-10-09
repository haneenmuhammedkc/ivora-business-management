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
      id: "total-capital",
      label: "TOTAL INVESTED CAPITAL",
      currency: "AED",
      value: kpis.totalCommittedCapitalAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Admin + Partner Capital",
    },
    {
      id: "inventory-on-hand",
      label: "INVENTORY ON HAND",
      currency: "AED",
      value: kpis.inventoryCarryingValueAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Valued at Landed Cost",
    },
    {
      id: "net-profit",
      variant: "highlight",
      label: "NET PROFIT",
      currency: "AED",
      value: kpis.netOperatingProfitAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Cumulative Trading Profit",
    },
    {
      id: "partner-balance",
      label: "PARTNER BALANCE",
      currency: "AED",
      value: kpis.pendingPartnerDisbursalAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Pending Disbursal",
    },
  ];

  return (
    <StatCardGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
