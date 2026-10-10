"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import { BusinessEntity } from "@/types/business";
import { ArrowRightIcon, BusinessesIcon } from "@/components/ui/icons";

export function PartnerDetailsCard() {
  const { user } = useAuth();
  const { data: businessData, isLoading: isLoadingBusinesses } = useCachedFetch<{
    success: boolean;
    businesses: BusinessEntity[];
  }>("/api/businesses");

  const assignedBusinesses = Array.isArray(businessData?.businesses)
    ? businessData.businesses
    : [];

  const fullName = user?.name || "Partner User";
  const email = user?.email || "—";
  const phone = user?.phone || "—";
  const status = user?.status || "ACTIVE";
  const roleDisplay = "Partner Workspace";

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6">
      {/* Section 1: Partner Account Information */}
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0c0d12] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "PT"}
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
                Partner Account Details
              </h2>
              <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                Personal credentials, contact information, and workspace profile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {status}
            </span>
          </div>
        </div>

        {/* Card Body - Grid */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                FULL NAME
              </span>
              <span className="text-xs font-bold text-gray-900 block truncate">
                {fullName}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                CORPORATE EMAIL
              </span>
              <span className="text-xs font-mono font-bold text-gray-900 block truncate">
                {email}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                DIRECT PHONE
              </span>
              <span className="text-xs font-mono font-bold text-gray-900 block truncate">
                {phone}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ROLE ASSIGNMENT
              </span>
              <span className="text-xs font-bold text-gray-900 block">
                {roleDisplay}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ACCESS SCOPE
              </span>
              <span className="text-xs font-bold text-gray-900 block">
                Assigned Entities Only ({assignedBusinesses.length})
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/40 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ACCOUNT CREATED
              </span>
              <span className="text-xs font-bold text-gray-900 block">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Assigned Businesses */}
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
              Assigned Businesses
            </h2>
            <p className="text-[11px] text-gray-500 font-normal mt-0.5">
              Trading entities and workspaces assigned to your partner account.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-700 rounded-md border border-gray-200 bg-gray-50 w-fit">
            {assignedBusinesses.length} {assignedBusinesses.length === 1 ? "Entity" : "Entities"}
          </span>
        </div>

        <div className="p-5">
          {isLoadingBusinesses ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Loading assigned businesses...
            </div>
          ) : assignedBusinesses.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <BusinessesIcon size={20} />
              </div>
              <p className="text-xs font-bold text-gray-800">No Businesses Assigned</p>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                No trading workspaces are currently assigned to your account. Please contact your system administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedBusinesses.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col justify-between p-4 rounded-xl border border-gray-200/90 bg-white hover:border-gray-300 transition-all shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-gray-950">{b.name}</h3>
                        {b.subtitle && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{b.subtitle}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                      {b.code && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[10px] font-semibold text-gray-700">
                          {b.code}
                        </span>
                      )}
                      {b.productType && (
                        <span className="text-[10px] font-medium text-gray-600">
                          • {b.productType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Workspace Access: <span className="font-bold text-gray-900">Active</span>
                    </span>
                    <Link
                      href={`/businesses/${b.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-950 hover:text-black group"
                    >
                      <span>Open</span>
                      <ArrowRightIcon size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
