import React from "react";
import Link from "next/link";
import { ReportCardItem, ReportIconType } from "@/types/reports";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface InstitutionalReportGridProps {
  reports: ReportCardItem[];
}

function ReportIcon({ type }: { type: ReportIconType }) {
  switch (type) {
    case "chart":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      );
    case "purchase":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case "sales":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "trading":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case "expense":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      );
    case "investor":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "profit-loss":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      );
    case "balance-sheet":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "settlement":
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
}

export function InstitutionalReportGrid({ reports }: InstitutionalReportGridProps) {
  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200/90 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-2">
            <span>Institutional Report Center</span>
            <span className="text-gray-400 font-bold text-[11px] normal-case">
              (10 Configured Statements)
            </span>
          </h2>
        </div>
        <span className="text-[10px] sm:text-[10.5px] font-bold text-gray-500 uppercase tracking-wider font-mono">
          ALL QUERIES AUDITED VIA SHA-256 LEDGER
        </span>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {reports.map((rep) => {
          const isSolidBadge = rep.badgeVariant === "solid";
          return (
            <div
              key={rep.id}
              className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs flex flex-col justify-between h-full min-h-[195px] transition-all hover:shadow-xs hover:border-gray-300"
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200/90 flex items-center justify-center text-gray-900 shadow-2xs">
                    <ReportIcon type={rep.iconType} />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase select-none ${
                      isSolidBadge
                        ? "bg-[#0c0d12] text-white"
                        : "bg-transparent border border-gray-300 text-gray-700"
                    }`}
                  >
                    {rep.badge}
                  </span>
                </div>

                {/* Card Middle: Title & Description */}
                <h3 className="text-xs sm:text-[13px] font-extrabold text-gray-950 mt-3 mb-1.5 leading-snug">
                  {rep.title}
                </h3>
                <p className="text-[11px] text-gray-500 font-normal leading-relaxed line-clamp-3">
                  {rep.description}
                </p>
              </div>

              {/* Card Footer: Metadata Left & Action Right */}
              <div className="border-t border-gray-100 pt-3 mt-3.5 flex items-center justify-between text-xs">
                <span className="text-[10.5px] font-semibold text-gray-500 tracking-tight">
                  {rep.footerLeft}
                </span>
                <Link
                  href={rep.routeHref}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-950 hover:text-black group transition-colors cursor-pointer"
                >
                  <span>Open Report</span>
                  <ArrowRightIcon size={11} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
