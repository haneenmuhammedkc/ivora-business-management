import React from "react";
import { Badge } from "@/components/ui/badge";

export function CompanyLicensingSection() {
  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Company Information & DIFC Licensing
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Commercial registration, tax validation tokens, and sovereign branding attributes.
          </p>
        </div>
        <Badge variant="outline" className="text-[9.5px] font-bold px-2 py-0.5 tracking-wider uppercase text-gray-700 border-gray-300 flex items-center gap-1">
          <span>🛡️</span>
          <span>DIFC REGISTRY VERIFIED</span>
        </Badge>
      </div>

      {/* Form Content */}
      <div className="p-5 space-y-4 text-xs">
        {/* Row 1: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              LEGAL ENTITY FORM
            </label>
            <input
              type="text"
              defaultValue="IVORA GENERAL TRADING LLC"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              DIFC REGISTRATION NO.
            </label>
            <input
              type="text"
              defaultValue="DIFC-CL-88921"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              UAE FEDERAL TAX TRN
            </label>
            <input
              type="text"
              defaultValue="100348291000003"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
            />
          </div>
        </div>

        {/* Row 2: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              REGISTERED CORPORATE DOMICILE
            </label>
            <input
              type="text"
              defaultValue="Unit 402, Gate Precinct 4, DIFC, Dubai, United Arab Emirates"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              INSTITUTIONAL DESK PHONE
            </label>
            <input
              type="text"
              defaultValue="+971 4 392 8100"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
            />
          </div>
        </div>

        {/* Row 3: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              DIRECT COMPLIANCE DESK EMAIL
            </label>
            <input
              type="email"
              defaultValue="compliance@ivora.com"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
            />
          </div>

          {/* Brand Package Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200/90 bg-gray-50/70">
            <div className="w-9 h-9 rounded-md bg-[#0c0d12] text-white flex items-center justify-center font-black text-xs tracking-wider shrink-0">
              IV
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-950">
                Official Enterprise Brand Package
              </h4>
              <p className="text-[10.5px] text-gray-500 font-normal">
                SVG vector lockups and cryptographic letterheads
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
