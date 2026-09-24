"use client";

import React from "react";
import { Input } from "@/components/ui/input";

export interface BusinessDetailsFormData {
  businessName: string;
  businessType: string;
  totalInvestment: string;
  description: string;
}

export interface BusinessDetailsSectionProps {
  data: BusinessDetailsFormData;
  onChange: (field: keyof BusinessDetailsFormData, value: string) => void;
  errors: Partial<Record<keyof BusinessDetailsFormData, string>>;
}

export function BusinessDetailsSection({
  data,
  onChange,
  errors,
}: BusinessDetailsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          1. Business Details
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Enter the core information for the new business.
        </p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Business Name */}
          <div>
            <label
              htmlFor="businessName"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              BUSINESS NAME <span className="text-red-500">*</span>
            </label>
            <Input
              id="businessName"
              placeholder="e.g. Business 03"
              value={data.businessName}
              onChange={(e) => onChange("businessName", e.target.value)}
              error={errors.businessName}
              required
            />
          </div>

          {/* Business Type (Text Input, NOT a dropdown) */}
          <div>
            <label
              htmlFor="businessType"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              BUSINESS TYPE <span className="text-red-500">*</span>
            </label>
            <Input
              id="businessType"
              placeholder="e.g. Trading, Logistics, Real Estate"
              value={data.businessType}
              onChange={(e) => onChange("businessType", e.target.value)}
              error={errors.businessType}
              required
            />
          </div>
        </div>

        {/* Total Investment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="totalInvestment"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              TOTAL INVESTMENT (AED) <span className="text-red-500">*</span>
            </label>
            <Input
              id="totalInvestment"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 100000"
              value={data.totalInvestment}
              onChange={(e) => onChange("totalInvestment", e.target.value)}
              error={errors.totalInvestment}
              helperText="Total capital allocated to this business entity."
              required
            />
          </div>
        </div>

        {/* Business Description */}
        <div>
          <label
            htmlFor="businessDescription"
            className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            BUSINESS DESCRIPTION
          </label>
          <textarea
            id="businessDescription"
            rows={3}
            placeholder="Describe the business, its activities, or trading purpose..."
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
            className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-hidden focus:ring-1 focus:ring-gray-900 shadow-2xs resize-y"
          />
        </div>
      </div>
    </div>
  );
}
