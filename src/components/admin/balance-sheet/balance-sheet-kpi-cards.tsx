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
      label: "TOTAL COMMITTED CAPITAL",
      currency: "AED",
      value: kpis.totalCommittedCapitalAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Admin & Partner Equity Pool",
    },
    {
      id: "inventory-carrying-value",
      label: "INVENTORY VALUATION",
      currency: "AED",
      value: kpis.inventoryCarryingValueAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Physical Gold in Vault",
    },
    {
      id: "realized-sales",
      label: "REALIZED SALES",
      currency: "AED",
      value: kpis.totalRealizedSalesAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Gross Trading Revenue",
    },
    {
      id: "net-operating-profit",
      label: "NET OPERATING PROFIT",
      currency: "AED",
      value: kpis.netOperatingProfitAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Sales - Sourcing & Overheads",
    },
    {
      id: "pending-disbursal",
      variant: "highlight",
      label: "PENDING DISBURSAL",
      currency: "AED",
      value: kpis.pendingPartnerDisbursalAED.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      description: "Unsettled Partner Share",
    },
  ];

  return (
    <StatCardGrid className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
