"use client";

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { AddPartnerForm } from "@/components/admin/profile/partners";

export default function AddPartnerPage() {
  return (
    <div className="space-y-6 pb-14 max-w-4xl">
      <FadeUp delay={0.06}>
        <PageHeader
          title="Add Partner"
          subtitle="Create a partner account, assign business access, and generate temporary login credentials."
        />
      </FadeUp>

      {/* Main Add Partner Form */}
      <FadeUp delay={0.1}>
        <AddPartnerForm />
      </FadeUp>
    </div>
  );
}
