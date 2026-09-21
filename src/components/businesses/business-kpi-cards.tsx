import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { BusinessesSummaryKPIs } from "@/types/business";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

export interface BusinessKpiCardsProps {
  kpis: BusinessesSummaryKPIs;
}

export function BusinessKpiCards({ kpis }: BusinessKpiCardsProps) {
  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StaggerItem>
        <StatCard
          label="TOTAL BUSINESSES"
          value={kpis.totalBusinesses.toString().padStart(2, "0")}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="ACTIVE BUSINESSES"
          value={kpis.activeBusinesses.toString().padStart(2, "0")}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="TOTAL PARTNERS"
          value={kpis.totalPartners.toString().padStart(2, "0")}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="COMBINED INVESTMENT"
          currency="AED"
          value={kpis.combinedInvestmentAED.toLocaleString()}
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          variant="highlight"
          label="COMBINED NET PROFIT"
          currency="AED"
          value={kpis.combinedNetProfitAED.toLocaleString()}
        />
      </StaggerItem>
    </StaggerContainer>
  );
}
