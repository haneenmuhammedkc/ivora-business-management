"use client";

import React, { useEffect, useRef } from "react";
import { XIcon } from "@/components/ui/icons";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xl ${className || ""}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-sm sm:text-base font-bold text-gray-950 truncate pr-2">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
