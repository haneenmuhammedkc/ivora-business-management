"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon, ArrowRightIcon } from "@/components/ui/icons";

export type PartnerStatus = "ACTIVE" | "DEACTIVE";

export interface PartnerItem {
  id: string;
  fullName: string;
  initials: string;
  corporateEmail: string;
  phone: string;
  role: string;
  status: PartnerStatus;
  businessCount?: number;
}

export const mockPartners: PartnerItem[] = [
  {
    id: "partner-b",
    fullName: "Partner B",
    initials: "PB",
    corporateEmail: "partnerb@ivora.com",
    phone: "+971 50 123 4567",
    role: "PARTNER",
    status: "ACTIVE",
  },
  {
    id: "partner-c",
    fullName: "Partner C",
    initials: "PC",
    corporateEmail: "partnerc@ivora.com",
    phone: "—",
    role: "PARTNER",
    status: "DEACTIVE",
  },
];

export interface ManagePartnersSectionProps {
  partners?: PartnerItem[];
}

export function ManagePartnersSection({
  partners,
}: ManagePartnersSectionProps) {
  const [partnerList, setPartnerList] = useState<PartnerItem[]>(
    partners || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!partners);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggleStatus = async (id: string) => {
    const currentPartner = partnerList.find((p) => p.id === id);
    if (!currentPartner || updatingId) return;

    setActionError(null);
    setUpdatingId(id);

    const nextBackendStatus =
      currentPartner.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const nextUiStatus: PartnerStatus =
      currentPartner.status === "ACTIVE" ? "DEACTIVE" : "ACTIVE";

    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextBackendStatus,
        }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Failed to parse server response",
      }));

      if (res.ok && data.success) {
        setPartnerList((prev) =>
          prev.map((partner) => {
            if (partner.id === id) {
              return {
                ...partner,
                status: nextUiStatus,
              };
            }
            return partner;
          })
        );
      } else {
        setActionError(
          data.error || "Failed to update partner status. Please try again."
        );
      }
    } catch {
      setActionError(
        "Network error occurred while updating partner status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (partners) {
      return;
    }

    let isSubscribed = true;

    async function fetchPartners() {
      try {
        const res = await fetch("/api/partners", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await (res.ok ? res.json() : null);

        if (isSubscribed && data?.success && Array.isArray(data.partners)) {
          interface RawPartner {
            id: string;
            name: string;
            email: string;
            phone?: string;
            role: string;
            status?: string;
            businesses?: unknown[];
          }

          const mapped: PartnerItem[] = data.partners.map(
            (p: RawPartner) => ({
              id: p.id,
              fullName: p.name,
              initials: p.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              corporateEmail: p.email,
              phone: p.phone || "—",
              role: p.role,
              status:
                p.status === "ACTIVE"
                  ? "ACTIVE"
                  : "DEACTIVE",
              businessCount: p.businesses?.length || 0,
            })
          );

          setPartnerList(mapped);
        }
      } catch (err) {
        console.error(
          "[ManagePartnersSection] Failed to load partners:",
          err
        );
        if (isSubscribed) {
          setActionError("Failed to load partner accounts from server.");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    void fetchPartners();

    return () => {
      isSubscribed = false;
    };
  }, [partners]);

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            MANAGE PARTNERS
          </h2>

          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Manage partner accounts and access details.
          </p>
        </div>

        <Link href="/profile/partners/new">
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={14} />}
            className="text-xs font-bold shrink-0 shadow-2xs"
          >
            Add Partner
          </Button>
        </Link>
      </div>

      <div className="p-5 space-y-4">
        {/* Action Error Notification */}
        {actionError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between gap-2">
            <div>
              <span className="font-bold">Error: </span>
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-red-500 hover:text-red-800 text-xs font-bold cursor-pointer px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Partners Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-bold">PARTNER NAME</th>
                <th className="px-4 py-3 font-bold">EMAIL</th>
                <th className="px-4 py-3 font-bold">PHONE</th>
                <th className="px-3.5 py-3 font-bold">ROLE</th>
                <th className="px-3.5 py-3 font-bold text-center">
                  STATUS
                </th>
                <th className="px-4 py-3 font-bold text-center">
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      <span className="text-xs font-semibold">Loading partners...</span>
                    </div>
                  </td>
                </tr>
              ) : partnerList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-xs">
                    No partner accounts registered in the system.
                  </td>
                </tr>
              ) : (
                partnerList.map((partner) => {
                const isActive = partner.status === "ACTIVE";
                const isUpdating = updatingId === partner.id;

                return (
                  <tr
                    key={partner.id}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    {/* Partner Name */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-gray-100 text-gray-900 border border-gray-200 font-extrabold text-[10.5px] flex items-center justify-center shrink-0">
                          {partner.initials}
                        </div>

                        <span className="font-bold text-gray-950 text-xs">
                          {partner.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Corporate Email */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600 font-mono">
                        {partner.corporateEmail}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs text-gray-600 font-mono">
                        {partner.phone}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase select-none bg-transparent border border-gray-300 text-gray-700">
                        {partner.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase select-none bg-[#0c0d12] text-white shadow-2xs">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase select-none bg-white border border-gray-300 text-gray-700 shadow-2xs">
                          DEACTIVE
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/profile/partners/${partner.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 hover:text-black hover:underline transition-colors cursor-pointer"
                        >
                          <span>Manage</span>
                          <ArrowRightIcon size={11} />
                        </Link>

                        <div className="h-3.5 w-px bg-gray-200" />

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          disabled={isUpdating}
                          aria-label={
                            isActive
                              ? `Deactivate ${partner.fullName}`
                              : `Activate ${partner.fullName}`
                          }
                          onClick={() =>
                            handleToggleStatus(partner.id)
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${
                            isUpdating ? "opacity-50 cursor-not-allowed" : ""
                          } ${
                            isActive
                              ? "bg-[#0c0d12]"
                              : "bg-gray-200 border border-gray-300/80"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full ring-0 transition duration-200 ease-in-out ${
                              isActive
                                ? "translate-x-4.5 bg-white shadow-xs"
                                : "translate-x-0.5 bg-gray-500 shadow-xs"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}