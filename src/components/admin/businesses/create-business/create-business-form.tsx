"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon, CheckIcon, ArrowRightIcon } from "@/components/ui/icons";
import { BusinessDetailsSection } from "./business-details-section";
import { BusinessPartnerSection } from "./business-partner-section";
import { InitialContributionsSection } from "./initial-contributions-section";

export function CreateBusinessForm() {
  const router = useRouter();

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [totalInvestment, setTotalInvestment] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [adminInvestment, setAdminInvestment] = useState("");
  const [partnerInvestment, setPartnerInvestment] = useState("");

  // Validation & Submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }

    if (!businessType.trim()) {
      newErrors.businessType = "Business type is required.";
    }

    const investmentNum = parseFloat(totalInvestment);
    if (!totalInvestment || isNaN(investmentNum) || investmentNum <= 0) {
      newErrors.totalInvestment = "Please enter a valid total investment amount.";
    }

    if (!partnerId) {
      newErrors.partnerId = "Please select a partner.";
    }

    if (adminInvestment) {
      const adminNum = parseFloat(adminInvestment);
      if (isNaN(adminNum) || adminNum < 0) {
        newErrors.adminInvestment = "Please enter a valid amount.";
      }
    }

    if (partnerInvestment) {
      const partnerNum = parseFloat(partnerInvestment);
      if (isNaN(partnerNum) || partnerNum < 0) {
        newErrors.partnerInvestment = "Please enter a valid amount.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  const handleResetForm = () => {
    setBusinessName("");
    setBusinessType("");
    setDescription("");
    setTotalInvestment("");
    setPartnerId("");
    setAdminInvestment("");
    setPartnerInvestment("");
    setErrors({});
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckIcon size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-950">
              Business Created Successfully
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              The new business entity has been configured with local parameters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50/80 border border-gray-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Business Name
            </span>
            <span className="font-bold text-gray-950 mt-1 block">
              {businessName}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Business Type
            </span>
            <span className="font-bold text-gray-950 mt-1 block">
              {businessType}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Total Investment
            </span>
            <span className="font-bold text-gray-950 font-mono mt-1 block">
              AED {parseFloat(totalInvestment).toLocaleString("en-US")}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Partner Assigned
            </span>
            <span className="font-bold text-gray-950 mt-1 block">
              {partnerId === "partner-b"
                ? "Partner B"
                : partnerId === "partner-c"
                ? "Partner C"
                : partnerId}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => router.push("/businesses")}
            icon={<ArrowRightIcon size={14} />}
            className="w-full sm:w-auto text-xs font-bold"
          >
            Back to Businesses
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleResetForm}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            Create Another Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Business Details (Name, Type, Total Investment, Description) */}
      <BusinessDetailsSection
        data={{ businessName, businessType, totalInvestment, description }}
        onChange={(field, value) => {
          if (field === "businessName") setBusinessName(value);
          if (field === "businessType") setBusinessType(value);
          if (field === "totalInvestment") setTotalInvestment(value);
          if (field === "description") setDescription(value);
          if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
          }
        }}
        errors={errors}
      />

      {/* 2. Business Partner */}
      <BusinessPartnerSection
        data={{ partnerId }}
        onChange={(_, value) => {
          setPartnerId(value);
          if (errors.partnerId) {
            setErrors((prev) => ({ ...prev, partnerId: "" }));
          }
        }}
        errors={errors}
      />

      {/* 3. Initial Investment Contributions (Admin & Partner Optional Contributions) */}
      <InitialContributionsSection
        data={{ adminInvestment, partnerInvestment }}
        onChange={(field, value) => {
          if (field === "adminInvestment") setAdminInvestment(value);
          if (field === "partnerInvestment") setPartnerInvestment(value);
          if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
          }
        }}
        errors={errors}
      />

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-200/90">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/businesses")}
          className="w-full sm:w-auto px-5 text-xs font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={<PlusIcon size={14} />}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 text-xs font-bold shadow-2xs"
        >
          {isSubmitting ? "Creating Business..." : "Create Business"}
        </Button>
      </div>
    </form>
  );
}
