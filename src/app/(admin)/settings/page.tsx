"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  GeneralConfigSection,
  CompanyLicensingSection,
  DeskModulesSidebar,
  DataExportArchival,
  mockDeskModules,
} from "@/components/admin/settings";
import { ManagePartnersSection } from "@/components/admin/profile";

export default function SettingsPage() {
  const [activeModuleId, setActiveModuleId] = useState("general");

  const renderActiveSection = () => {
    switch (activeModuleId) {
      case "general":
        return <GeneralConfigSection />;

      case "company":
        return <CompanyLicensingSection />;

      case "partners":
        return <ManagePartnersSection />;

      case "entities":
        return <CompanyLicensingSection />;

      case "audit":
        return <DataExportArchival />;

      case "danger":
        return <DataExportArchival />;

      default:
        return <GeneralConfigSection />;
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Settings"
          subtitle="Central Governance For Enterprise Configuration, Entity Partition Scopes, Partner RBAC Access, And Cryptographic Audit Controls."
        />
      </FadeUp>

      {/* Main Settings Navigation & Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area: Dynamically displays active module section */}
        <div className="lg:col-span-8 space-y-6">
          <FadeUp key={activeModuleId} delay={0.08}>
            {renderActiveSection()}
          </FadeUp>
        </div>

        {/* Desk Modules Sidebar Navigation */}
        <div className="lg:col-span-4 sticky top-6">
          <FadeUp delay={0.1}>
            <DeskModulesSidebar
              modules={mockDeskModules}
              activeModuleId={activeModuleId}
              onSelectModule={setActiveModuleId}
            />
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
