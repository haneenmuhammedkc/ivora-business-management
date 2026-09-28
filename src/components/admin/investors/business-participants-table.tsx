"use client";

import React from "react";
import { InvestorRecord } from "@/types/investors";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface BusinessParticipantsTableProps {
  participants: InvestorRecord[];
  selectedParticipantId: string | null;
  onSelectParticipant: (participant: InvestorRecord) => void;
  isLoading?: boolean;
}

export function BusinessParticipantsTable({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  isLoading = false,
}: BusinessParticipantsTableProps) {
  const activeParticipants = participants.filter((p) => p.investmentAED > 0);

  return (
    <div className="w-full rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Business Investors
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              All investment participants and external investors registered under this business entity.
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 bg-gray-50">
            {activeParticipants.length} {activeParticipants.length === 1 ? "Participant" : "Participants"}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-5 py-3.5 font-bold">INVESTOR / PARTICIPANT</th>
              <th className="px-3.5 py-3.5 font-bold text-center">TYPE</th>
              <th className="px-4 py-3.5 font-bold text-right">INVESTMENT</th>
              <th className="px-4 py-3.5 font-bold">DATE</th>
              <th className="px-3.5 py-3.5 font-bold text-center">SHARE %</th>
              <th className="px-3.5 py-3.5 font-bold text-center">STATUS</th>
              <th className="px-5 py-3.5 font-bold text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    <span>Loading business investors...</span>
                  </div>
                </td>
              </tr>
            ) : activeParticipants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No investment participants have been added to this business yet.
                </td>
              </tr>
            ) : (
              activeParticipants.map((p) => {
                const isCurrent = p.id === selectedParticipantId;
                const pType = p.participantType || "INVESTOR";

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectParticipant(p)}
                    className={`transition-colors cursor-pointer hover:bg-gray-50/70 ${
                      isCurrent ? "bg-gray-50/60" : ""
                    }`}
                  >
                    {/* Participant Info */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-950 text-xs sm:text-[13px]">
                            {p.name}
                          </span>
                          {p.isMultiEntity && (
                            <span className="px-1.5 py-0.2 text-[9.5px] font-bold text-gray-600 border border-gray-300 rounded uppercase">
                              MULTI
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 font-medium">
                          {p.emailOrSubtitle}
                        </span>
                      </div>
                    </td>

                    {/* Participant Type Badge */}
                    <td className="px-3.5 py-4 text-center whitespace-nowrap">
                      {pType === "ADMIN" && (
                        <span className="inline-block px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-purple-700 bg-purple-50 border border-purple-200 rounded uppercase">
                          ADMIN
                        </span>
                      )}
                      {pType === "PARTNER" && (
                        <span className="inline-block px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded uppercase">
                          PARTNER
                        </span>
                      )}
                      {pType === "INVESTOR" && (
                        <span className="inline-block px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded uppercase">
                          INVESTOR
                        </span>
                      )}
                    </td>

                    {/* Investment */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                          AED
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-gray-900 mt-0.5">
                          {p.investmentAED.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {p.date}
                    </td>

                    {/* Share % */}
                    <td className="px-3.5 py-4 text-center">
                      <span className="font-bold text-gray-950 text-xs">
                        {p.sharePercent !== null && p.sharePercent !== undefined
                          ? `${p.sharePercent}%`
                          : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-900 border border-gray-900 rounded uppercase">
                        {p.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectParticipant(p);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowRightIcon size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
