"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ShieldCheckIcon, HelpCircleIcon, ArrowLeftIcon } from "@/components/ui/icons";

export interface AuthCardProps {
  children: React.ReactNode;
  topAction?: "help" | "back" | "none";
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function AuthCard({
  children,
  topAction = "help",
  backHref = "/login",
  backLabel = "Back to Sign In",
  className = "",
}: AuthCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Action */}
      {topAction === "help" && (
        <div className="absolute top-8 right-8">
          <a
            href="#help"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <HelpCircleIcon size={14} />
            Need Help?
          </a>
        </div>
      )}

      {topAction === "back" && (
        <div className="absolute top-8 left-8 sm:left-12">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon size={14} />
            {backLabel}
          </Link>
        </div>
      )}

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-[440px] rounded-3xl bg-[#f0f4f8] p-8 sm:p-10 shadow-xl shadow-slate-200/40 border border-[#e2e8f0] ${className}`}
      >
        {children}
      </motion.div>

      {/* Security Footer Note */}
      <div className="mt-12 flex items-center gap-2 text-xs text-gray-500 font-medium">
        <ShieldCheckIcon size={15} className="text-gray-400" />
        <span>Bank-grade 256-bit SSL encryption. Authorized access only.</span>
      </div>
    </div>
  );
}
