"use client";

import React, { use } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { EditPartnerForm } from "@/components/admin/profile/partners";

interface EditPartnerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPartnerPage({ params }: EditPartnerPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6 pb-14 max-w-4xl">
      <FadeUp delay={0.06}>
        <PageHeader
          title="Manage Partner"
          subtitle="View and update partner account details, contact information, and security scopes."
        />
      </FadeUp>

      {/* Main Edit Partner Form */}
      <FadeUp delay={0.1}>
        <EditPartnerForm partnerId={id} />
      </FadeUp>
    </div>
  );
}
