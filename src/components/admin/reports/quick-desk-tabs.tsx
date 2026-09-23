import React from "react";
import { QuickDeskTabItem } from "@/types/reports";

export interface QuickDeskTabsProps {
  tabs: QuickDeskTabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

export function QuickDeskTabs({
  tabs,
  activeTabId,
  onTabChange,
}: QuickDeskTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
      <div className="flex items-center gap-1.5 mr-1 text-gray-900 font-black text-xs uppercase tracking-wider">
        <span>⚡</span>
        <span>QUICK DESK:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                isActive
                  ? "bg-[#0c0d12] text-white border border-[#0c0d12]"
                  : "bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
