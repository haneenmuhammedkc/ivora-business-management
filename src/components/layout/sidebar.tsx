"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  IvoraLogo,
  DashboardIcon,
  BusinessesIcon,
  PurchaseIcon,
  SalesIcon,
  TradingCycleIcon,
  InvestorsIcon,
  ExpensesIcon,
  ProfitLossIcon,
  BalanceSheetIcon,
  ReportsIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
} from "../ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Businesses", href: "/businesses", icon: BusinessesIcon },
  { label: "Purchase", href: "/purchase", icon: PurchaseIcon },
  { label: "Sales", href: "/sales", icon: SalesIcon },
  { label: "Trading Cycle", href: "/trading-cycle", icon: TradingCycleIcon },
  { label: "Investors", href: "/investors", icon: InvestorsIcon },
  { label: "Expenses", href: "/expenses", icon: ExpensesIcon },
  { label: "Profit & Loss", href: "/profit-loss", icon: ProfitLossIcon },
  { label: "Balance Sheet", href: "/balance-sheet", icon: BalanceSheetIcon },
  { label: "Reports", href: "/reports", icon: ReportsIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isOpen, onClose, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Brand Header without dividing line */}
      <div className="flex items-center justify-between px-6 pt-7 pb-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-gray-900 focus:outline-none"
          onClick={onClose}
        >
          <IvoraLogo className="h-7 w-auto text-gray-950" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <XIcon size={18} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? "bg-[#0c0d12] text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                }`}
              >
                <IconComponent
                  size={16}
                  className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0c0d12] text-[11px] font-bold text-white tracking-wider">
              AV
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-white border border-gray-200" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-gray-900">
                Alexander Vane
              </span>
              <span className="truncate text-[10px] text-gray-400 font-medium">
                Main Admin A • Root
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOutIcon size={15} />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-64 h-screen flex-col border-r border-gray-200/80 bg-white ${className}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation with Motion */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-in Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                duration: shouldReduceMotion ? 0.1 : 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200/80 bg-white shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
