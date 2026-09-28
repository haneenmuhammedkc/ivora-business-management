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
}

export function BusinessPartnerSection({
  data,
  onChange,
  errors,
  partnerOptions = [],
  isLoading = false,
  fetchError = null,
  onRetry,
}: BusinessPartnerSectionProps) {
  // Build dynamic dropdown options based on state
  const computedOptions: SelectOption[] = isLoading
    ? [{ value: "", label: "Loading partners..." }]
    : fetchError
    ? [{ value: "", label: "Error loading partners" }]
    : partnerOptions.length === 0
    ? [{ value: "", label: "No partners available. Create a partner first." }]
    : [{ value: "", label: "Select Partner" }, ...partnerOptions];

  const hasNoPartners = !isLoading && !fetchError && partnerOptions.length === 0;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            2. Business Partner
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Assign an authenticated partner to operate this business partition.
          </p>
        </div>
        <Link
          href="/profile/partners/new"
          className="text-[11px] font-semibold text-gray-600 hover:text-gray-950 transition-colors hidden sm:block"
        >
          + Create New Partner
        </Link>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="max-w-md space-y-2">
          <label
            htmlFor="partnerSelect"
            className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            PARTNER <span className="text-red-500">*</span>
          </label>

          <Select
            id="partnerSelect"
            value={data.partnerId}
            onChange={(e) => onChange("partnerId", e.target.value)}
            options={computedOptions}
            disabled={isLoading || hasNoPartners}
            className={`h-10 text-xs sm:text-sm ${
              errors.partnerId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
            }`}
            required
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

          {/* Empty state guidance */}
          {hasNoPartners && (
            <div className="mt-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex flex-col gap-1">
              <span className="font-bold">No Partners Available</span>
              <p className="text-[11px] text-amber-700">
                You must create a partner account in Partner Management before creating a business partition.
              </p>
              <Link
                href="/profile/partners/new"
                className="font-bold text-xs text-amber-900 underline mt-1"
              >
                Go to Partner Management &rarr;
              </Link>
            </div>
          )}

          {/* Default helper text */}
          {!errors.partnerId && !fetchError && !hasNoPartners && (
            <p className="mt-1.5 text-[11px] text-gray-500">
              Select from real Partner accounts registered in the Ivora platform.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
