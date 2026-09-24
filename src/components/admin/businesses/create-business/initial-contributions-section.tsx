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
}

export function InitialContributionsSection({
  data,
  onChange,
  errors = {},
}: InitialContributionsSectionProps) {
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
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Admin Investment */}
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

          {/* Partner Investment */}
          <div>
            <label
              htmlFor="partnerInvestment"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              PARTNER INVESTMENT (AED)
            </label>
            <Input
              id="partnerInvestment"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 50000"
              value={data.partnerInvestment}
              onChange={(e) => onChange("partnerInvestment", e.target.value)}
              error={errors.partnerInvestment}
            />
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
