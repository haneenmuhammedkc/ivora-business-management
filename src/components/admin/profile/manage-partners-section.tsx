"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";

export type PartnerStatus = "ACTIVE" | "DEACTIVE";

export interface PartnerItem {
  id: string;
  fullName: string;
  initials: string;
  corporateEmail: string;
  phone: string;
  role: string;
  status: PartnerStatus;
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
  partners = mockPartners,
}: ManagePartnersSectionProps) {
  const [partnerList, setPartnerList] = useState<PartnerItem[]>(partners);

  const handleToggleStatus = (id: string) => {
    setPartnerList((prev) =>
      prev.map((partner) => {
        if (partner.id === id) {
          const nextStatus: PartnerStatus =
            partner.status === "ACTIVE" ? "DEACTIVE" : "ACTIVE";
          return { ...partner, status: nextStatus };
        }
        return partner;
      })
    );
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 bg-white">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Manage Partners
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

      <div className="p-5">
        {/* Partners Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-bold">PARTNER NAME</th>
                <th className="px-4 py-3 font-bold">EMAIL</th>
                <th className="px-4 py-3 font-bold">PHONE</th>
                <th className="px-3.5 py-3 font-bold">ROLE</th>
                <th className="px-3.5 py-3 font-bold text-center">STATUS</th>
                <th className="px-4 py-3 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {partnerList.map((partner) => {
                const isActive = partner.status === "ACTIVE";

                return (
                  <tr
                    key={partner.id}
                    className="transition-colors hover:bg-gray-50/60"
                  >
                    {/* Partner Name & Initials */}
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

                    {/* Status Badge */}
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

                    {/* Action: Black & White Accessible Status Toggle */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          aria-label={
                            isActive
                              ? `Deactivate ${partner.fullName}`
                              : `Activate ${partner.fullName}`
                          }
                          onClick={() => handleToggleStatus(partner.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
