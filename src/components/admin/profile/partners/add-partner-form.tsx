"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerDetailsSection, PartnerDetailsFormData } from "./partner-details-section";
import { PartnerAccessSection, PartnerLoginAccessFormData } from "./partner-access-section";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRightIcon } from "@/components/ui/icons";

export function AddPartnerForm() {
  const router = useRouter();

  // Form states
  const [partnerDetails, setPartnerDetails] = useState<PartnerDetailsFormData>({
    fullName: "",
    corporateEmail: "",
    phone: "",
  });

  const [loginAccess, setLoginAccess] = useState<PartnerLoginAccessFormData>({
    loginEmail: "",
    temporaryPassword: "",
    confirmTemporaryPassword: "",
  });

  const [hasCustomLoginEmail, setHasCustomLoginEmail] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-sync corporate email with login email if user hasn't customized login email
  const handlePartnerDetailsChange = (field: keyof PartnerDetailsFormData, value: string) => {
    setPartnerDetails((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    if (field === "corporateEmail" && !hasCustomLoginEmail) {
      setLoginAccess((prev) => ({ ...prev, loginEmail: value }));
      if (errors.loginEmail) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.loginEmail;
          return copy;
        });
      }
    }
  };

  const handleLoginAccessChange = (field: keyof PartnerLoginAccessFormData, value: string) => {
    if (field === "loginEmail") {
      setHasCustomLoginEmail(true);
    }
    setLoginAccess((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Partner Details Validation
    if (!partnerDetails.fullName.trim()) {
      newErrors.fullName = "Partner full name is required.";
    }

    if (!partnerDetails.corporateEmail.trim()) {
      newErrors.corporateEmail = "Corporate email address is required.";
    } else if (!emailRegex.test(partnerDetails.corporateEmail.trim())) {
      newErrors.corporateEmail = "Please enter a valid email address (e.g. name@firm.ae).";
    }

    // 2. Login Access Validation
    const effectiveLoginEmail = loginAccess.loginEmail.trim() || partnerDetails.corporateEmail.trim();
    if (!effectiveLoginEmail) {
      newErrors.loginEmail = "Login identifier email is required.";
    } else if (!emailRegex.test(effectiveLoginEmail)) {
      newErrors.loginEmail = "Please enter a valid login email address.";
    }

    const pw = loginAccess.temporaryPassword;
    if (!pw) {
      newErrors.temporaryPassword = "Temporary password is required.";
    } else if (pw.length < 8) {
      newErrors.temporaryPassword = "Password must be at least 8 characters long.";
    } else if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) {
      newErrors.temporaryPassword = "Password must contain both letters and numbers.";
    }

    if (!loginAccess.confirmTemporaryPassword) {
      newErrors.confirmTemporaryPassword = "Confirmation password is required.";
    } else if (pw !== loginAccess.confirmTemporaryPassword) {
      newErrors.confirmTemporaryPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 450);
  };

  const handleResetForm = () => {
    setPartnerDetails({
      fullName: "",
      corporateEmail: "",
      phone: "",
    });
    setLoginAccess({
      loginEmail: "",
      temporaryPassword: "",
      confirmTemporaryPassword: "",
    });
    setHasCustomLoginEmail(false);
    setErrors({});
    setIsSuccess(false);
  };

  // Success Confirmation View
  if (isSuccess) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <CheckIcon size={24} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-950">
              Partner Account Validated & Ready
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The partner profile structure has been validated and prepared for backend provisioning.
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl bg-gray-50/80 border border-gray-200/80 p-5 space-y-4 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            PARTNER PROFILE SUMMARY
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400 font-medium block text-[11px]">FULL NAME</span>
              <span className="font-bold text-gray-950 text-sm mt-0.5 block">
                {partnerDetails.fullName}
              </span>
            </div>

            <div>
              <span className="text-gray-400 font-medium block text-[11px]">CORPORATE EMAIL</span>
              <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                {partnerDetails.corporateEmail}
              </span>
            </div>

            <div>
              <span className="text-gray-400 font-medium block text-[11px]">DIRECT PHONE</span>
              <span className="font-mono font-semibold text-gray-900 text-xs mt-0.5 block">
                {partnerDetails.phone || "Not specified"}
              </span>
            </div>

            <div>
              <span className="text-gray-400 font-medium block text-[11px]">LOGIN IDENTIFIER</span>
              <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                {loginAccess.loginEmail || partnerDetails.corporateEmail}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-gray-400 font-medium block text-[11px]">CREDENTIAL STATUS</span>
              <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">
                Temporary Password Configured (Session Staged)
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="secondary"
            size="md"
            onClick={handleResetForm}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            + Add Another Partner
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push("/profile")}
            icon={<ArrowRightIcon size={14} />}
            iconPosition="right"
            className="w-full sm:w-auto text-xs font-bold"
          >
            Back to Partners
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* 1. Partner Details */}
      <PartnerDetailsSection
        data={partnerDetails}
        onChange={handlePartnerDetailsChange}
        errors={{
          fullName: errors.fullName,
          corporateEmail: errors.corporateEmail,
        }}
      />

      {/* 2. Partner Login Access */}
      <PartnerAccessSection
        data={loginAccess}
        onChange={handleLoginAccessChange}
        errors={{
          loginEmail: errors.loginEmail,
          temporaryPassword: errors.temporaryPassword,
          confirmTemporaryPassword: errors.confirmTemporaryPassword,
        }}
      />

      {/* Form Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => router.push("/profile")}
            className="w-1/2 sm:w-auto text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            icon={<ArrowRightIcon size={14} />}
            iconPosition="right"
            className="w-1/2 sm:w-auto text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? "Validating..." : "Create Partner"}
          </Button>
        </div>
      </div>
    </form>
  );
}
