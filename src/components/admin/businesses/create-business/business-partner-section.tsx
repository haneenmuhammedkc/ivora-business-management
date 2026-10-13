"use client";

import React from "react";
import Link from "next/link";
import { Select, SelectOption } from "@/components/ui/select";

export interface BusinessPartnerFormData {
  partnerId: string;
}

export interface BusinessPartnerSectionProps {
  data: BusinessPartnerFormData;
  onChange: (field: keyof BusinessPartnerFormData, value: string) => void;
  errors: Partial<Record<keyof BusinessPartnerFormData, string>>;
  partnerOptions?: SelectOption[];
  isLoading?: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  isPartnerUser?: boolean;
  currentUserName?: string;
  currentUserEmail?: string;
}

export function BusinessPartnerSection({
  data,
  onChange,
  errors,
  partnerOptions = [],
  isLoading = false,
  fetchError = null,
  onRetry,
  isPartnerUser = false,
  currentUserName,
  currentUserEmail,
}: BusinessPartnerSectionProps) {
  // Build dynamic dropdown options based on state
  const computedOptions: SelectOption[] = isLoading
    ? [{ value: "", label: "Loading partners..." }]
    : fetchError
    ? [{ value: "", label: "Error loading partners" }]
    : [
        { value: "", label: "No Partner (Unassigned)" },
        ...partnerOptions,
      ];

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            2. Business Partner {isPartnerUser ? "" : "(Optional)"}
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            {isPartnerUser
              ? "You are assigned as the operating partner for this business partition."
              : "Assign an authenticated partner to operate this business partition, or leave unassigned."}
          </p>
        </div>
        {!isPartnerUser && (
          <Link
            href="/profile/partners/new"
            className="text-[11px] font-semibold text-gray-600 hover:text-gray-950 transition-colors hidden sm:block"
          >
            + Create New Partner
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="max-w-md space-y-2">
          {isPartnerUser ? (
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                OPERATING PARTNER
              </label>
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50/80 border border-gray-200/90">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {(currentUserName || "P").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-950">
                      {currentUserName || "Current Partner"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {currentUserEmail || "Authenticated Partner"}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Assigned
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Your partner account will automatically operate and manage this business.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="partnerSelect"
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                PARTNER <span className="text-gray-400 font-normal">(OPTIONAL)</span>
              </label>

              <Select
                id="partnerSelect"
                value={data.partnerId}
                onChange={(e) => onChange("partnerId", e.target.value)}
                options={computedOptions}
                disabled={isLoading}
                className={`h-10 text-xs sm:text-sm ${
                  errors.partnerId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
              />

              {/* Error message from validation */}
              {errors.partnerId && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">
                  {errors.partnerId}
                </p>
              )}

              {/* Fetch error state */}
              {fetchError && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                  <span>{fetchError}</span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="font-bold underline text-red-800 hover:text-red-950 ml-2"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Informational note if no partners exist */}
              {!isLoading && !fetchError && partnerOptions.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-700">
                  No partner accounts found. You can leave this unassigned to create an Admin-only business.
                </p>
              )}

              {/* Default helper text */}
              {!errors.partnerId && !fetchError && partnerOptions.length > 0 && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Select an authenticated Partner, or choose &quot;No Partner (Unassigned)&quot; for an Admin-only business.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
