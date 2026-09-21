"use client";

import React from "react";
import Link from "next/link";
import { IvoraLogo, MenuIcon } from "../ui/icons";

export interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <Link href="/dashboard" className="flex items-center">
        <IvoraLogo className="h-6 w-auto text-gray-950" />
      </Link>
      <button
        onClick={onOpenSidebar}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
        aria-label="Open navigation menu"
      >
        <MenuIcon size={20} />
      </button>
    </header>
  );
}
