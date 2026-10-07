"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon, CheckIcon, ArrowRightIcon } from "@/components/ui/icons";
import { BusinessDetailsSection } from "./business-details-section";
import { BusinessPartnerSection } from "./business-partner-section";
import { InitialContributionsSection } from "./initial-contributions-section";
import {
  validateCreateBusiness,
  validateBusinessName,
  validateBusinessType,
  validateBusinessDescription,
  validatePartnerId,
  validateTotalInvestment,
  validateAdminInvestment,
  validatePartnerInvestment,
  BusinessValidationErrors,
} from "@/validators";

interface CreatedBusinessInfo {
  id: string;
  name: string;
  code: string;
  partner?: {
    id: string;
    name: string;
    email: string;
  };
}

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

  // Dynamic Partners state
  const [partnerOptions, setPartnerOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);

  // Validation & Submission states
  const [errors, setErrors] = useState<BusinessValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdBusiness, setCreatedBusiness] = useState<CreatedBusinessInfo | null>(null);

  // Manual retry handler for partner options
  const handleRetryPartners = () => {
    setIsLoadingPartners(true);
    setPartnersError(null);
    fetch("/api/partners", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.partners)) {
          const validPartners = data.partners.filter(
            (p: { id: string; name: string; role?: string }) => p.role === "PARTNER"
          );
          const options = validPartners.map((p: { id: string; name: string }) => ({
            value: p.id,
            label: p.name,
          }));
          setPartnerOptions(options);
        } else {
          setPartnersError(data.message || data.error || "Unable to load partners. Please try again.");
        }
        setIsLoadingPartners(false);
      })
      .catch(() => {
        setPartnersError("Unable to load partners. Please try again.");
        setIsLoadingPartners(false);
      });
  };

  // Fetch real partners on component mount
  useEffect(() => {
    let isMounted = true;

    fetch("/api/partners", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && Array.isArray(data.partners)) {
            const validPartners = data.partners.filter(
              (p: { id: string; name: string; role?: string }) => p.role === "PARTNER"
            );
            const options = validPartners.map((p: { id: string; name: string }) => ({
              value: p.id,
              label: p.name,
            }));
            setPartnerOptions(options);
          } else {
            setPartnersError(data.message || data.error || "Unable to load partners. Please try again.");
          }
          setIsLoadingPartners(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPartnersError("Unable to load partners. Please try again.");
          setIsLoadingPartners(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Helper to revalidate financial fields (total, admin, partner) and cross-field contribution sum.
   */
  const revalidateFinancials = (
    newTotal: string,
    newAdmin: string,
    newPartner: string,
    changedField?: "totalInvestment" | "adminInvestment" | "partnerInvestment"
  ) => {
    setErrors((prev) => {
      const next = { ...prev };

      // Total investment validation
      const totalErr = validateTotalInvestment(newTotal);
      if (changedField === "totalInvestment" || prev.totalInvestment) {
        if (totalErr) next.totalInvestment = totalErr;
        else delete next.totalInvestment;
      }

      const parsedTotal = totalErr ? undefined : Number(newTotal) || 0;

      // Admin investment validation
      const adminErr = validateAdminInvestment(newAdmin, parsedTotal);
      if (changedField === "adminInvestment" || prev.adminInvestment) {
        if (adminErr) next.adminInvestment = adminErr;
        else delete next.adminInvestment;
      }

      // Partner investment validation
      const partnerErr = validatePartnerInvestment(newPartner, parsedTotal);
      if (changedField === "partnerInvestment" || prev.partnerInvestment) {
        if (partnerErr) next.partnerInvestment = partnerErr;
        else delete next.partnerInvestment;
      }

      // Cross-field sum check
      if (
        !totalErr &&
        !adminErr &&
        !partnerErr &&
        parsedTotal !== undefined &&
        parsedTotal > 0
      ) {
        const adminNum = newAdmin ? Number(newAdmin) || 0 : 0;
        const partnerNum = newPartner ? Number(newPartner) || 0 : 0;
        const sum = Math.round((adminNum + partnerNum) * 100) / 100;
        const total = Math.round(parsedTotal * 100) / 100;

        if (sum > total) {
          next.adminInvestment =
            "Sum of admin and partner investments cannot exceed total investment.";
          next.partnerInvestment =
            "Sum of admin and partner investments cannot exceed total investment.";
        } else {
          // Clear cross-field errors if they were previously set
          if (
            next.adminInvestment ===
            "Sum of admin and partner investments cannot exceed total investment."
          ) {
            delete next.adminInvestment;
          }
          if (
            next.partnerInvestment ===
            "Sum of admin and partner investments cannot exceed total investment."
          ) {
            delete next.partnerInvestment;
          }
        }
      }

      return next;
    });
  };

  const handleFieldChange = (
    field:
      | "businessName"
      | "businessType"
      | "totalInvestment"
      | "description"
      | "partnerId"
      | "adminInvestment"
      | "partnerInvestment",
    value: string
  ) => {
    if (field === "businessName") {
      setBusinessName(value);
      if (errors.businessName) {
        const err = validateBusinessName(value);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.businessName = err;
          else delete next.businessName;
          return next;
        });
      }
    } else if (field === "businessType") {
      setBusinessType(value);
      if (errors.businessType) {
        const err = validateBusinessType(value);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.businessType = err;
          else delete next.businessType;
          return next;
        });
      }
    } else if (field === "description") {
      setDescription(value);
      if (errors.description) {
        const err = validateBusinessDescription(value);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.description = err;
          else delete next.description;
          return next;
        });
      }
    } else if (field === "partnerId") {
      setPartnerId(value);
      if (errors.partnerId) {
        const err = validatePartnerId(value);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.partnerId = err;
          else delete next.partnerId;
          return next;
        });
      }
    } else if (field === "totalInvestment") {
      setTotalInvestment(value);
      revalidateFinancials(value, adminInvestment, partnerInvestment, "totalInvestment");
    } else if (field === "adminInvestment") {
      setAdminInvestment(value);
      revalidateFinancials(totalInvestment, value, partnerInvestment, "adminInvestment");
    } else if (field === "partnerInvestment") {
      setPartnerInvestment(value);
      revalidateFinancials(totalInvestment, adminInvestment, value, "partnerInvestment");
    }
  };

  /**
   * Helper to scroll and focus to the first invalid field.
   */
  const focusFirstError = (validationErrors: BusinessValidationErrors) => {
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length === 0) return;

    const elementIdMap: Record<string, string> = {
      businessName: "businessName",
      businessType: "businessType",
      totalInvestment: "totalInvestment",
      partnerId: "partnerSelect",
      adminInvestment: "adminInvestment",
      partnerInvestment: "partnerInvestment",
      description: "businessDescription",
    };

    for (const key of errorKeys) {
      const targetId = elementIdMap[key];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Run centralized business validator
    const validationResult = validateCreateBusiness({
      businessName,
      businessType,
      totalInvestment,
      description,
      partnerId,
      adminInvestment,
      partnerInvestment,
    });

    if (!validationResult.isValid || !validationResult.data) {
      setErrors(validationResult.errors);
      focusFirstError(validationResult.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validationResult.data),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setCreatedBusiness(data.business);
        setIsSuccess(true);
      } else {
        if (data.errors && typeof data.errors === "object") {
          setErrors(data.errors);
          focusFirstError(data.errors);
        }
        const errorMsg =
          data.message || data.error || "Failed to create business entity.";
        setApiError(errorMsg);
      }
    } catch {
      setApiError("A network error occurred while creating the business. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
    setApiError(null);
    setCreatedBusiness(null);
    setIsSuccess(false);
  };

  if (isSuccess && createdBusiness) {
    const selectedOption = partnerOptions.find((p) => p.value === partnerId);
    const partnerDisplay =
      createdBusiness.partner?.name || selectedOption?.label || partnerId;

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
              The new business entity &quot;{createdBusiness.code}&quot; has been configured and saved in the database.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50/80 border border-gray-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Business Name
            </span>
            <span className="font-bold text-gray-950 mt-1 block">
              {createdBusiness.name}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Business Code
            </span>
            <span className="font-bold text-gray-950 font-mono mt-1 block">
              {createdBusiness.code}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Total Investment
            </span>
            <span className="font-bold text-gray-950 font-mono mt-1 block">
              AED {parseFloat(totalInvestment || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
              Partner Assigned
            </span>
            <span className="font-bold text-gray-950 mt-1 block truncate">
              {partnerDisplay}
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
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* API Error Notification */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-[11px] text-red-800">Error:</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* 1. Business Details (Name, Type, Total Investment, Description) */}
      <BusinessDetailsSection
        data={{ businessName, businessType, totalInvestment, description }}
        onChange={(field, value) => handleFieldChange(field, value)}
        errors={errors}
      />

      {/* 2. Business Partner */}
      <BusinessPartnerSection
        data={{ partnerId }}
        partnerOptions={partnerOptions}
        isLoading={isLoadingPartners}
        fetchError={partnersError}
        onRetry={handleRetryPartners}
        onChange={(_, value) => handleFieldChange("partnerId", value)}
        errors={errors}
      />

      {/* 3. Initial Investment Contributions (Admin & Partner Optional Contributions) */}
      <InitialContributionsSection
        data={{ adminInvestment, partnerInvestment }}
        onChange={(field, value) => handleFieldChange(field, value)}
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
