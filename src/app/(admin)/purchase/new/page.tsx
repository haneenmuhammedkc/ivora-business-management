import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { NewPurchaseEntry } from "@/components/admin/purchase";

export const metadata = {
  title: "New Purchase Entry - Ivora",
  description: "Record Dubai physical trading acquisition and landed expenses.",
};

export default function NewPurchasePage() {
  return (
    <div className="space-y-6 pb-14 max-w-5xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/purchase"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Purchases</span>
          </Link>
        </div>
      </FadeUp>

      {/* Main New Purchase Form */}
      <FadeUp delay={0.1}>
        <NewPurchaseEntry />
      </FadeUp>
    </div>
  );
}
