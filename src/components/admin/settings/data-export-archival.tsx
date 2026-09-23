import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function DataExportArchival() {
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
            Data Export Configuration & Archival Controls
          </h2>
          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
            Export standards, cryptographic watermarking, and irrevocable entity partition lifecycle.
          </p>
        </div>
        <Badge variant="outline" className="text-[9.5px] font-bold px-2 py-0.5 tracking-wider uppercase text-gray-700 border-gray-300">
          RESTRICTED DESK
        </Badge>
      </div>

      <div className="p-5 space-y-5">
        {/* Specification & Watermarking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              AUDIT EXPORT FORMAT SPECIFICATION
            </span>
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <span>📄</span>
                <span>Standard DIFC Bundle: PDF/A-3b + Raw Encrypted XLSX</span>
              </div>
              <span className="text-[9.5px] font-mono text-gray-500 font-bold">
                SHA-256 HASHED
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              INSTITUTIONAL WATERMARKING ENGINE
            </span>
            <div className="p-3 rounded-lg border border-gray-200 bg-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <span>🛡️</span>
                <span>Auto-embed confidential viewer audit trace token</span>
              </div>
              <button
                type="button"
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                  watermarkEnabled
                    ? "bg-[#0c0d12] text-white"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}
              >
                {watermarkEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>
          </div>
        </div>

        {/* Irrevocable Archival & Quarantine Box */}
        <div className="p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
            <div className="flex items-start gap-2.5 text-xs text-gray-800">
              <span className="text-base text-gray-700">⚠️</span>
              <div>
                <h4 className="font-black text-gray-950 text-xs">
                  Irrevocable Archival & Ledger Quarantine
                </h4>
                <p className="text-[11px] text-gray-600 font-normal mt-0.5 leading-relaxed">
                  Under DIFC statutory financial regulations, hard-deletions are strictly prohibited. Ledger partitions are permanently sealed and retained for 10 years.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-md border border-gray-300 bg-white text-center shrink-0">
              <div className="text-[9.5px] font-extrabold uppercase tracking-wider text-gray-800">
                ZERO HARD DELETES
              </div>
            </div>
          </div>

          {/* Action Row 1: Archive Business Entity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h4 className="font-bold text-gray-950 text-xs">
                Archive Business Entity (Partition Scope)
              </h4>
              <p className="text-[11px] text-gray-500 font-normal">
                Freezes entity books, cancels active trade clearances, and transitions ledger into cold storage.
              </p>
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs font-bold hover:bg-gray-50 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Archive Business Entity...
            </button>
          </div>

          {/* Action Row 2: Reset UI Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-200/60">
            <div>
              <h4 className="font-bold text-gray-950 text-xs">
                Reset UI Workspace & Column Metrics
              </h4>
              <p className="text-[11px] text-gray-500 font-normal">
                Restores all financial views and column metrics to factory enterprise baseline.
              </p>
            </div>
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Reset UI Workspace Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
