import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { StatCardGrid } from "@/components/ui/stat-card-grid";

export function ProfileOverview() {
  const profileMetrics = [
    {
      id: "role",
      label: "GOVERNANCE ROLE",
      value: "Root Admin",
      description: "Unrestricted sovereign ledger",
    },
    {
      id: "entities",
      label: "ENTITY PARTITIONS",
      value: "2 Businesses",
      description: "Dubai (DXB) → Mumbai (BOM)",
    },
    {
      id: "partners",
      label: "MANAGED PARTNERS",
      value: "2 Active",
      description: "Partner B (40%) • Partner C (35%)",
    },
    {
      id: "security",
      label: "AUTHENTICATION",
      value: "Hardware 2FA",
      description: "YubiKey 5C NFC Verified",
      variant: "highlight" as const,
    },
    {
      id: "sessions",
      label: "ACTIVE SESSIONS",
      value: "2 Devices",
      description: "MacBook Pro + iPhone 15 Pro",
    },
    {
      id: "compliance",
      label: "COMPLIANCE STATUS",
      value: "IFRS-9 / DIFC",
      description: "Sovereign Audit Key Active",
    },
  ];

  return (
    <StatCardGrid>
      {profileMetrics.map((kpi) => (
        <StatCard
          key={kpi.id}
          label={kpi.label}
          value={kpi.value}
          description={kpi.description}
          variant={kpi.variant}
        />
      ))}
    </StatCardGrid>
  );
}
