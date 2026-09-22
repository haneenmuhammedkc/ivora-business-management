import React from "react";
import { Badge } from "@/components/ui/badge";

export function GeneralConfigSection() {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            General Application Configuration
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Core baseline parameters, calendar parsing, and accounting denomination standards.
          </p>
        </div>
        <Badge variant="outline" className="text-[9.5px] font-bold px-2 py-0.5 tracking-wider uppercase text-gray-600 border-gray-300">
          SCOPE: GLOBAL SYSTEM
        </Badge>
      </div>

      {/* Form Content */}
      <div className="p-5 space-y-4 text-xs">
        {/* Row 1: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              APPLICATION IDENTIFIER
            </label>
            <input
              type="text"
              defaultValue="IVORA"
              disabled
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-800 cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-400 italic">Locked system alias</p>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              REGISTERED TRADING ENTITY NAME
            </label>
            <input
              type="text"
              defaultValue="IVORA GENERAL TRADING LLC"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>
        </div>

        {/* Row 2: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              SYSTEM LOCALE & LANGUAGE
            </label>
            <select
              defaultValue="English (UK)"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer"
            >
              <option value="English (UK)">English (UK)</option>
              <option value="English (US)">English (US)</option>
              <option value="Arabic (UAE)">Arabic (UAE)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              OPERATING TIME ZONE
            </label>
            <select
              defaultValue="GMT +04:00 (Dubai / UAE)"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer"
            >
              <option value="GMT +04:00 (Dubai / UAE)">GMT +04:00 (Dubai / UAE)</option>
              <option value="GMT +05:30 (Mumbai / India)">GMT +05:30 (Mumbai / India)</option>
              <option value="GMT +00:00 (London / UK)">GMT +00:00 (London / UK)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              DEFAULT DATE FORMAT
            </label>
            <select
              defaultValue="DD MMM YYYY (e.g. 10 Sep 2026)"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 cursor-pointer"
            >
              <option value="DD MMM YYYY (e.g. 10 Sep 2026)">DD MMM YYYY (e.g. 10 Sep 2026)</option>
              <option value="DD/MM/YYYY (e.g. 10/09/2026)">DD/MM/YYYY (e.g. 10/09/2026)</option>
              <option value="YYYY-MM-DD (e.g. 2026-09-10)">YYYY-MM-DD (e.g. 2026-09-10)</option>
            </select>
          </div>
        </div>

        {/* Row 3: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              NUMERIC GROUPING SEPARATOR
            </label>
            <input
              type="text"
              defaultValue="1,234.56"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              PRIMARY ACCOUNTING BASE CURRENCY
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                defaultValue="AED — United Arab Emirates Dirham"
                disabled
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-900 cursor-not-allowed"
              />
              <span className="h-9 px-3 rounded-lg bg-[#0c0d12] text-white flex items-center justify-center text-[10px] font-extrabold whitespace-nowrap tracking-wider">
                PEGGED 1.0000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
