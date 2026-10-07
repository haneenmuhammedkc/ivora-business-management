"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { FadeUp } from "@/components/ui/motion";
import { PlusIcon } from "@/components/ui/icons";
import {
  BusinessParticipantsTable,
  InvestorDetailsPanel,
} from "@/components/admin/investors";
import { BusinessInvestorDetails, InvestorRecord } from "@/types/investors";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default function BusinessInvestorDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const { data, error: fetchError, isLoading } = useCachedFetch<{
    success: boolean;
    business: BusinessInvestorDetails;
    message?: string;
    error?: string;
  }>(businessId ? `/api/investors/business/${encodeURIComponent(businessId)}` : null);

  const business = data?.business || null;
  const error = fetchError
    ? fetchError.message
    : data && !data.success
    ? data.message || data.error || "Failed to load business investor details"
    : null;

  const [selectedParticipantId, setSelectedParticipantId] = useState<string>("");

  const activeParticipantId =
    selectedParticipantId || (business?.participants && business.participants.length > 0 ? business.participants[0].id : "");

  const activeParticipant =
    business?.participants.find((p) => p.id === activeParticipantId) || null;

  return (
    <div className="space-y-6 pb-14">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/investors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to All Businesses</span>
          </Link>
        </div>
      </FadeUp>

      {/* Page Header with Add Investor Action */}
      <FadeUp delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <PageHeader
              title={business ? `Investor Details: ${business.name}` : "Business Investor Details"}
              subtitle={
                business
                  ? `${business.name} • ${business.code} • ${business.businessType} Trading Workspace`
                  : "Track all investment participants and external investors."
              }
            />
          </div>

          <Link
            href={`/investors/new?businessId=${encodeURIComponent(businessId)}`}
            className="inline-flex items-center justify-center font-semibold transition-colors bg-[#0c0d12] text-white hover:bg-[#1e222d] shadow-xs h-10 px-4 text-xs gap-2 rounded-lg shrink-0 w-full sm:w-auto"
          >
            <PlusIcon size={15} />
            <span>+ Add Investor</span>
          </Link>
        </div>
      </FadeUp>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Business Overview Cards */}
      {business && (
        <FadeUp delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Investment Base */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                TOTAL INVESTMENT
              </span>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-gray-950">
                  AED {business.totalInvestmentAED.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  Authoritative Base Capital
                </span>
              </div>
            </div>

            {/* Admin Investment */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                ADMIN INVESTMENT
              </span>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-gray-950">
                  AED {business.adminInvestmentAED.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  Direct Treasury Allocation
                </span>
              </div>
            </div>

            {/* Partner Investment */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                PARTNER INVESTMENT
              </span>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-gray-950">
                  AED {business.partnerInvestmentAED.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  {business.partner.name} ({business.partnerEquityPct}%)
                </span>
              </div>
            </div>

            {/* External Capital */}
            <div className="p-4 rounded-xl border border-gray-200/90 bg-white shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                EXTERNAL INVESTMENTS
              </span>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-gray-950">
                  AED {business.totalExternalInvestmentAED.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                  {business.participants.filter((p) => p.participantType === "INVESTOR").length} External Investors
                </span>
              </div>
            </div>
          </div>
        </FadeUp>
      )}

      {/* Business Investors Table */}
      <FadeUp delay={0.2}>
        <BusinessParticipantsTable
          participants={business?.participants || []}
          selectedParticipantId={activeParticipantId}
          onSelectParticipant={(p: InvestorRecord) => setSelectedParticipantId(p.id)}
          isLoading={isLoading}
        />
      </FadeUp>

      {/* Selected Participant Details Panel */}
      {activeParticipant && (
        <FadeUp delay={0.25}>
          <InvestorDetailsPanel
            investor={activeParticipant}
            onClose={() => setSelectedParticipantId("")}
          />
        </FadeUp>
      )}
    </div>
  );
}
