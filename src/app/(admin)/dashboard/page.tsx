import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";
import { Select } from "@/components/ui/select";
import { FadeUp, StaggerItem } from "@/components/ui/motion";
import { PhysicalTradingLifecycle } from "@/components/dashboard/trading-lifecycle";
import { BusinessPerformance } from "@/components/dashboard/business-performance";
import { TradingPerformance } from "@/components/dashboard/trading-performance";
import { InvestorOverview } from "@/components/dashboard/investor-overview";

interface DashboardKPI {
  id: string;
  label: string;
  currency: string;
  value: string;
  description: string;
  variant?: "default" | "highlight";
}

const DASHBOARD_KPIS: DashboardKPI[] = [
  {
    id: "total-investment",
    label: "TOTAL INVESTMENT",
    currency: "AED",
    value: "250,000",
    description: "Across all businesses",
  },
  {
    id: "purchase-cost",
    label: "PURCHASE COST",
    currency: "AED",
    value: "185,400",
    description: "999.9 Bullion & Freight",
  },
  {
    id: "total-expenses",
    label: "TOTAL EXPENSES",
    currency: "AED",
    value: "12,850",
    description: "Labour + Delivery + Custc",
  },
  {
    id: "total-sales",
    label: "TOTAL SALES",
    currency: "AED",
    value: "235,600",
    description: "India Sales (Zaveri)",
  },
  {
    id: "net-profit",
    label: "NET PROFIT",
    currency: "AED",
    value: "37,350",
    description: "After all cleared expenses",
    variant: "highlight",
  },
  {
    id: "investor-share",
    label: "INVESTOR SHARE",
    currency: "AED",
    value: "14,940",
    description: "Profit distributed contract",
  },
];

export default function DashboardPage() {
  const businessOptions = [
    { value: "all", label: "All Businesses" },
    { value: "b1", label: "Business 01 (A + B)" },
    { value: "b2", label: "Business 02 (A + C)" },
  ];

  return (
    <div className="space-y-7 pb-10">
      {/* 1. Dashboard Header */}
      <FadeUp delay={0} duration={0.3}>
        <PageHeader
          title="Good morning"
          subtitle="Thu 10 Sep"
          actions={
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                CURRENT BUSINESS
              </span>
              <div className="relative inline-flex items-center">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-black pointer-events-none z-10" />
                <Select
                  options={businessOptions}
                  className="w-44 pl-6 text-xs font-semibold"
                  defaultValue="all"
                />
              </div>
            </div>
          }
        />
      </FadeUp>

      {/* 2. KPI Cards (Staggered Entrance) */}
      <StatCardGrid>
        {DASHBOARD_KPIS.map((kpi) => (
          <StaggerItem key={kpi.id}>
            <StatCard
              label={kpi.label}
              currency={kpi.currency}
              value={kpi.value}
              description={kpi.description}
              variant={kpi.variant}
            />
          </StaggerItem>
        ))}
      </StatCardGrid>

      {/* 3. Physical Trading Lifecycle Section */}
      <FadeUp delay={0.12} duration={0.35}>
        <PhysicalTradingLifecycle />
      </FadeUp>

      {/* 4. Business Performance Section */}
      <FadeUp delay={0.18} duration={0.35}>
        <BusinessPerformance />
      </FadeUp>

      {/* 5 & 6. Bottom Grid: Trading Performance & Investor Overview */}
      <FadeUp delay={0.24} duration={0.35}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trading Performance Card */}
          <div className="lg:col-span-8">
            <TradingPerformance />
          </div>

          {/* Investor Overview Card */}
          <div className="lg:col-span-4">
            <InvestorOverview />
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
