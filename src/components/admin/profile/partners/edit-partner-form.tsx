"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MailIcon, CheckIcon, ArrowRightIcon } from "@/components/ui/icons";
import { validatePhone } from "@/validators/partner.validator";

export interface EditPartnerFormProps {
  partnerId: string;
}

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function EditPartnerForm({ partnerId }: EditPartnerFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PARTNER");
  const [status, setStatus] = useState("ACTIVE");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    fetch(`/api/partners/${partnerId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Partner account not found"
              : "Failed to load partner details"
          );
        }
        return res.json();
      })
      .then((data) => {
        if (isSubscribed && data?.success && data.partner) {
          const p: PartnerData = data.partner;
          setFullName(p.name || "");
          setPhone(p.phone || "");
          setEmail(p.email || "");
          setRole(p.role || "PARTNER");
          setStatus(p.status || "ACTIVE");
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setLoadError(err instanceof Error ? err.message : "Failed to load partner");
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [partnerId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Partner full name is required.";
    }

    if (phone.trim()) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        newErrors.phone = phoneError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
        }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Failed to parse server response",
      }));

      if (res.ok && data.success) {
        setSuccessMessage("Partner profile updated successfully.");

        if (data.partner) {
          setFullName(data.partner.name || fullName);
          setPhone(data.partner.phone || phone);
        }

        setTimeout(() => {
          router.push("/profile");
        }, 1000);
      } else {
        setApiError(data.error || "Failed to update partner profile.");
      }
    } catch {
      setApiError("Network error occurred while saving partner details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs p-8 text-center space-y-3">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        <p className="text-xs text-gray-500 font-medium">Loading partner details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-red-900">Unable to load Partner</h2>
        <p className="text-xs text-red-700">{loadError}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/profile")}
          className="text-xs font-semibold"
        >
          ← Back to Partners
        </Button>
      </div>
    );
  }

  const isPendingActivation = status === "PENDING_ACTIVATION";
  const isActive = status === "ACTIVE";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* 1. Account & Legal Profile */}
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            1. Partner Profile Details
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Update account name and primary contact telephone number.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name - Editable */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                FULL NAME <span className="text-red-500">*</span>
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.fullName;
                      return copy;
                    });
                  }
                }}
                placeholder="e.g., Tariq Al-Mansoor"
                className={
                  errors.fullName
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                required
              />
              {errors.fullName && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Phone Number - Editable */}
            <div>
              <label
                htmlFor="phone"
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                PHONE NUMBER <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.phone;
                      return copy;
                    });
                  }
                }}
                placeholder="+971 50 123 4567"
                className={
                  errors.phone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
                required
              />
              {errors.phone && (
                <p className="text-[11px] font-medium text-red-600 mt-1">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Identifiers & Access (Read-Only) */}
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            2. System Identifiers & Governance
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Immutable credentials, system roles, and account governance metadata.
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Corporate / Login Email (Read-Only) */}
            <div className="sm:col-span-1 rounded-lg bg-gray-50 border border-gray-200/80 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                LOGIN IDENTIFIER (EMAIL)
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-gray-900">
                <MailIcon size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                Read-only login identifier
              </span>
            </div>

            {/* Assigned Role (Read-Only) */}
            <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                SECURITY ROLE
              </span>
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-transparent border border-gray-300 text-gray-700">
                  {role}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                Business-scoped access
              </span>
            </div>

            {/* Account Status (Read-Only) */}
            <div className="rounded-lg bg-gray-50 border border-gray-200/80 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                CURRENT STATUS
              </span>
              <div>
                {isActive ? (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#0c0d12] text-white shadow-2xs">
                    ACTIVE
                  </span>
                ) : isPendingActivation ? (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    PENDING ACTIVATION
                  </span>
                ) : (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white border border-gray-300 text-gray-700 shadow-2xs">
                    DEACTIVE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                Managed via Partner Directory
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckIcon size={16} className="text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {apiError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span className="font-bold">Error:</span>
          <span>{apiError}</span>
        </div>
      )}

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
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
