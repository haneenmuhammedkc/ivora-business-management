import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { NewSaleEntry } from "@/components/sales";

export const metadata = {
  title: "New Sale Entry - Ivora",
  description: "Record India sales liquidation against active consignment.",
};

export default function NewSalePage() {
  return (
    <div className="space-y-6 pb-14 max-w-5xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Sales</span>
          </Link>
        </div>
      </FadeUp>

      {/* Main New Sale Form */}
      <FadeUp delay={0.1}>
        <NewSaleEntry />
      </FadeUp>
    </div>
  );
}
