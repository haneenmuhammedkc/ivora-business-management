"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import {
  AdminDetailsCard,
  PartnerDetailsCard,
  ManagePartnersSection,
  ChangePasswordSection,
} from "@/components/admin/profile";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (isLoading) {
    return (
      <div className="space-y-6 pb-14">
        <PageHeader
          title="Profile"
          subtitle="Loading your profile and security settings..."
        />
        <div className="w-full rounded-xl border border-gray-200/90 bg-white p-12 text-center text-xs text-gray-500 shadow-2xs">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Page Header */}
      <FadeUp delay={0.05}>
        <PageHeader
          title={isAdmin ? "Admin Profile" : "Partner Profile"}
          subtitle={
            isAdmin
              ? "Manage your account details, partners, and security preferences."
              : "View your personal account details, assigned businesses, and security preferences."
          }
        />
      </FadeUp>

      {/* Main Profile Sections */}
      <div className="space-y-6">
        {isAdmin ? (
          <>
            {/* Section 1: Administrator Account Details */}
            <FadeUp delay={0.15}>
              <AdminDetailsCard />
            </FadeUp>

            {/* Section 2: Manage Partners & Entity Scopes */}
            <FadeUp delay={0.2}>
              <ManagePartnersSection />
            </FadeUp>
          </>
        ) : (
          /* Section 1: Partner Details & Assigned Businesses */
          <FadeUp delay={0.15}>
            <PartnerDetailsCard />
          </FadeUp>
        )}

        {/* Section 3: Change Password (Shared) */}
        <FadeUp delay={0.25}>
          <ChangePasswordSection />
        </FadeUp>
      </div>
    </div>
  );
}

