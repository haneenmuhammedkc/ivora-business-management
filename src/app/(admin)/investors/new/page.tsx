import React from "react";
import Link from "next/link";
import { FadeUp } from "@/components/ui/motion";
import { NewInvestorEntry } from "@/components/investors";

export const metadata = {
  title: "New Investor Registration - Ivora",
  description: "Register capital allocation, partner equity terms, and settlement escrow.",
};

export default function NewInvestorPage() {
  return (
    <div className="space-y-6 pb-14 max-w-5xl">
      {/* Top Back Navigation Link */}
      <FadeUp delay={0.05}>
        <div className="flex items-center gap-2">
          <Link
            href="/investors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>← Back to Investors</span>
          </Link>
        </div>
      </FadeUp>

      {/* Main New Investor Form */}
      <FadeUp delay={0.1}>
        <NewInvestorEntry />
      </FadeUp>
    </div>
  );
}
