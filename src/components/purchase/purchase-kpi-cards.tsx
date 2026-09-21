import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { PurchaseSummaryKPIs } from "@/types/purchase";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export interface PurchaseKpiCardsProps {
  kpis: PurchaseSummaryKPIs;
}

export function PurchaseKpiCards({ kpis }: PurchaseKpiCardsProps) {
  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 max-w-4xl gap-4">
      <StaggerItem>
        <StatCard
          label="TOTAL PURCHASE"
          value={kpis.totalPurchase.toString().padStart(2, "0")}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="TOTAL SOURCING COST"
          currency="AED"
          value={kpis.totalSourcingCostAED.toLocaleString()}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="LOGISTICS & OVERHEAD"
          currency="AED"
          value={kpis.logisticsOverheadAED.toLocaleString()}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
