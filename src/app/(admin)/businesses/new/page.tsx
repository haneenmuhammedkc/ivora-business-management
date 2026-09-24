"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { CreateBusinessForm } from "@/components/admin/businesses/create-business";

export default function CreateNewBusinessPage() {
  return (
    <div className="space-y-6 pb-14 max-w-4xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.04}>
        <div className="flex items-center gap-2">
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Businesses</span>
          </Link>
        </div>
      </FadeUp>

      {/* Page Header */}
      <FadeUp delay={0.08}>
        <PageHeader
          title="Create New Business"
          subtitle="Set up a new business, assign its partner, and record its investment structure."
        />
      </FadeUp>

      {/* Main Create Business Form */}
      <FadeUp delay={0.12}>
        <CreateBusinessForm />
      </FadeUp>
    </div>
  );
}
