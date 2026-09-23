import React from "react";
import { Input } from "@/components/ui/input";
import { MailIcon } from "@/components/ui/icons";

export interface PartnerDetailsFormData {
  fullName: string;
  corporateEmail: string;
  phone: string;
}

export interface PartnerDetailsSectionProps {
  data: PartnerDetailsFormData;
  onChange: (field: keyof PartnerDetailsFormData, value: string) => void;
  errors: Partial<Record<keyof PartnerDetailsFormData, string>>;
}

export function PartnerDetailsSection({
  data,
  onChange,
  errors,
}: PartnerDetailsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          1. Partner Details
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Enter the partner&apos;s account, legal identification, and corporate contact information.
        </p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              FULL NAME <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="e.g., Tariq Al-Mansoor"
              className={errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              required
            />
            {errors.fullName && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Corporate Email */}
          <div>
            <label
              htmlFor="corporateEmail"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              CORPORATE EMAIL <span className="text-red-500">*</span>
            </label>
            <Input
              id="corporateEmail"
              type="email"
              value={data.corporateEmail}
              onChange={(e) => onChange("corporateEmail", e.target.value)}
              icon={<MailIcon size={16} />}
              iconPosition="left"
              placeholder="name@partner-firm.ae"
              className={errors.corporateEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
              required
            />
            {errors.corporateEmail && (
              <p className="text-[11px] font-medium text-red-600 mt-1">
                {errors.corporateEmail}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="sm:col-span-2">
            <label
              htmlFor="phone"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              PHONE NUMBER
            </label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="+971 50 123 4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
