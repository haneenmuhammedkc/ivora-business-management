"use client";

import React from "react";
import { Select, SelectOption } from "@/components/ui/select";

export interface BusinessPartnerFormData {
  partnerId: string;
}

export interface BusinessPartnerSectionProps {
  data: BusinessPartnerFormData;
  onChange: (field: keyof BusinessPartnerFormData, value: string) => void;
  errors: Partial<Record<keyof BusinessPartnerFormData, string>>;
  partnerOptions?: SelectOption[];
}

export const defaultPartnerOptions: SelectOption[] = [
  { value: "", label: "Select Partner" },
  { value: "partner-b", label: "Partner B" },
  { value: "partner-c", label: "Partner C" },
];

export function BusinessPartnerSection({
  data,
  onChange,
  errors,
  partnerOptions = defaultPartnerOptions,
}: BusinessPartnerSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          2. Business Partner
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Assign a partner to this business.
        </p>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="max-w-md">
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
            options={partnerOptions}
            className={`h-10 text-xs sm:text-sm ${
              errors.partnerId ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
            }`}
            required
          />
          {errors.partnerId ? (
            <p className="mt-1 text-[11px] text-red-600 font-medium">
              {errors.partnerId}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-gray-500">
              Select the partner who will operate this business partition.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
