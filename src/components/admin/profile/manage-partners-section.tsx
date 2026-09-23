"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, PlusIcon } from "@/components/ui/icons";

export interface PartnerItem {
  id: string;
  fullName: string;
  initials: string;
  corporateEmail: string;
  phone: string;
  role: string;
}

export const mockPartners: PartnerItem[] = [
  {
    id: "ptn-01",
    fullName: "Partner B",
    initials: "PB",
    corporateEmail: "partnerb@ivora.com",
    phone: "+971 50 123 4567",
    role: "PARTNER",
  },
  {
    id: "ptn-02",
    fullName: "Partner C",
    initials: "PC",
    corporateEmail: "partnerc@ivora.com",
    phone: "—",
    role: "PARTNER",
  },
];

export interface ManagePartnersSectionProps {
  partners?: PartnerItem[];
}

export function ManagePartnersSection({
  partners = mockPartners,
}: ManagePartnersSectionProps) {
  const [partnerList] = useState<PartnerItem[]>(partners);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);

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
                <th className="px-4 py-3 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {partnerList.map((partner) => (
                <tr key={partner.id} className="transition-colors hover:bg-gray-50/60">
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

                  {/* Action */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartner(
                          selectedPartner === partner.id ? null : partner.id
                        );
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-900 hover:text-black transition-colors cursor-pointer"
                    >
                      <span>{selectedPartner === partner.id ? "Close" : "Manage"}</span>
                      <ArrowRightIcon size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
