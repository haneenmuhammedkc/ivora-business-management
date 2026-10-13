"use client";

import React from "react";
import { Input } from "@/components/ui/input";

export interface InitialContributionsFormData {
  adminInvestment: string;
  partnerInvestment: string;
}

export interface InitialContributionsSectionProps {
  data: InitialContributionsFormData;
  onChange: (field: keyof InitialContributionsFormData, value: string) => void;
  errors?: Partial<Record<keyof InitialContributionsFormData, string>>;
  isPartnerAssigned?: boolean;
  isPartnerUser?: boolean;
  includeAdminParticipation?: boolean;
  onAdminParticipationChange?: (include: boolean) => void;
}

export function InitialContributionsSection({
  data,
  onChange,
  errors = {},
  isPartnerAssigned = true,
  isPartnerUser = false,
  includeAdminParticipation = false,
  onAdminParticipationChange,
}: InitialContributionsSectionProps) {
  // For Partner users, Admin investment is only shown if includeAdminParticipation is true.
  // For Admin users, both fields are always shown as before.
  const showAdminInvestment = !isPartnerUser || includeAdminParticipation;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          3. Initial Investment Contributions
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Specify optional initial contribution amounts for the Admin and Partner.
        </p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Admin Participation Choice (PARTNER ONLY) */}
        {isPartnerUser && (
          <div className="space-y-2 pb-2 border-b border-gray-100">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-0.5">
                ADMIN PARTICIPATION
              </label>
              <p className="text-[11px] text-gray-500">
                Choose whether the Admin will participate financially in this business.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1: No Admin Participation */}
              <button
                type="button"
                onClick={() => onAdminParticipationChange?.(false)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  !includeAdminParticipation
                    ? "border-gray-950 bg-gray-50/90 shadow-2xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-950">No Admin Participation</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      !includeAdminParticipation
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {!includeAdminParticipation && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  This business will operate without Admin capital.
                </p>
              </button>

              {/* Option 2: Include Admin Participation */}
              <button
                type="button"
                onClick={() => onAdminParticipationChange?.(true)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  includeAdminParticipation
                    ? "border-gray-950 bg-gray-50/90 shadow-2xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-950">Include Admin Participation</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      includeAdminParticipation
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {includeAdminParticipation && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  The Admin will participate and may contribute initial capital.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Investment Fields */}
        <div
          className={`grid grid-cols-1 ${
            showAdminInvestment ? "sm:grid-cols-2" : "sm:grid-cols-1 max-w-md"
          } gap-4`}
        >
          {/* Admin Investment (Shown for Admin users, or Partner users with includeAdminParticipation) */}
          {showAdminInvestment && (
            <div>
              <label
                htmlFor="adminInvestment"
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                ADMIN INVESTMENT (AED)
              </label>
              <Input
                id="adminInvestment"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 50000"
                value={data.adminInvestment}
                onChange={(e) => onChange("adminInvestment", e.target.value)}
                error={errors.adminInvestment}
              />
            </div>
          )}

          {/* Partner Investment */}
          <div>
            <label
              htmlFor="partnerInvestment"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              PARTNER INVESTMENT (AED){" "}
              {!isPartnerAssigned && (
                <span className="text-gray-400 font-normal lowercase">(disabled)</span>
              )}
            </label>
            <Input
              id="partnerInvestment"
              type="number"
              min="0"
              step="any"
              placeholder={isPartnerAssigned ? "e.g. 50000" : "No partner assigned (AED 0)"}
              value={isPartnerAssigned ? data.partnerInvestment : ""}
              onChange={(e) => onChange("partnerInvestment", e.target.value)}
              disabled={!isPartnerAssigned}
              error={isPartnerAssigned ? errors.partnerInvestment : undefined}
            />
            {!isPartnerAssigned && (
              <p className="mt-1 text-[11px] text-gray-400">
                Partner contribution is available when a partner is assigned.
              </p>
            )}
          </div>
        </div>

        {/* Disclaimer Text */}
        <p className="text-[11px] text-gray-500 leading-normal pt-1">
          Investor accounts can be added later from the Investors section after the business is created.
        </p>
      </div>
    </div>
  );
}
