"use client";

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  AdminDetailsCard,
  ManagePartnersSection,
  ChangePasswordSection
} from "@/components/admin/profile";

export default function AdminProfilePage() {
  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title="Admin Profile"
          subtitle="Manage your account details, partners, and security preferences."
        />
      </FadeUp>

      {/* Main Profile Sections */}
      <div className="space-y-6">
        {/* Section 1: Administrator Account Details */}
        <FadeUp delay={0.15}>
          <AdminDetailsCard />
        </FadeUp>

        {/* Section 2: Manage Partners & Entity Scopes */}
        <FadeUp delay={0.2}>
          <ManagePartnersSection />
        </FadeUp>

        {/* Section 3: Change Password */}
        <FadeUp delay={0.25}>
          <ChangePasswordSection />
        </FadeUp>
      </div>
    </div>
  );
}
