import React from "react";
import { StatCard, StatCardProps } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { ReportsSummaryKPIs } from "@/types/reports";
import { StaggerItem } from "@/components/ui/motion";

export interface ReportsKpiCardsProps {
  kpis: ReportsSummaryKPIs;
}

export function ReportsKpiCards({ kpis }: ReportsKpiCardsProps) {
  const stats: (StatCardProps & { id: string })[] = [
    {
      id: "total-sales",
      label: "TOTAL SALES",
      currency: "AED",
      value: kpis.totalSalesAED.toLocaleString(),
    },
    {
      id: "total-purchase",
      label: "TOTAL PURCHASE",
      currency: "AED",
      value: kpis.totalPurchaseAED.toLocaleString(),
    },
    {
      id: "total-expenses",
      label: "TOTAL EXPENSES",
      currency: "AED",
      value: kpis.totalExpensesAED.toLocaleString(),
    },
    {
      id: "net-profit",
      variant: "highlight",
      label: "NET PROFIT",
      currency: "AED",
      value: kpis.netProfitAED.toLocaleString(),
    },
    {
      id: "investor-share",
      label: "INVESTOR SHARE",
      currency: "AED",
      value: kpis.investorShareAED.toLocaleString(),
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
