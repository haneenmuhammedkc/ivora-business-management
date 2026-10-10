"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogOutIcon, AlertTriangleIcon } from "@/components/ui/icons";

export interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

interface LogoutModalContentProps {
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

function LogoutModalContent({ onClose, triggerRef }: LogoutModalContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: Focus Cancel button upon mount
  useEffect(() => {
    const timer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCancel = useCallback(() => {
    if (isLoggingOut) return;
    onClose();
    // Return focus to trigger button
    triggerRef?.current?.focus();
  }, [isLoggingOut, onClose, triggerRef]);

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setErrorMessage(null);

    try {
      await logout();
    } catch (err) {
      console.error("[LogoutConfirmationModal] Error during sign out:", err);
      setIsLoggingOut(false);
      setErrorMessage("Unable to sign out at this moment. Please try again.");
    }
  };

  // Keyboard navigation: Escape to close, Tab focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]:not([disabled])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
    >
      {/* Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal Content Card */}
      <motion.div
        ref={modalRef}
        initial={{
          opacity: 0,
          scale: shouldReduceMotion ? 1 : 0.95,
          y: shouldReduceMotion ? 0 : 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: shouldReduceMotion ? 1 : 0.95,
          y: shouldReduceMotion ? 0 : 8,
        }}
        transition={{
          duration: shouldReduceMotion ? 0.1 : 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200/90 bg-white p-6 shadow-2xl space-y-5 text-center sm:p-7"
      >
        {/* Top Icon Badge */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200/80 text-gray-900 shadow-2xs">
          <LogOutIcon size={22} className="text-gray-900 translate-x-0.5" />
        </div>

        {/* Typography */}
        <div className="space-y-1.5">
          <h2
            id="logout-dialog-title"
            className="text-base sm:text-lg font-bold tracking-tight text-gray-950"
          >
            Sign out?
          </h2>
          <p
            id="logout-dialog-description"
            className="text-xs text-gray-500 leading-relaxed max-w-[280px] mx-auto"
          >
            Are you sure you want to sign out of your Ivora account?
          </p>
        </div>

        {/* Error Message (if any) */}
        {errorMessage && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium text-left flex items-start gap-2">
            <AlertTriangleIcon size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoggingOut}
            className="flex-1 h-10 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            ref={logoutButtonRef}
            type="button"
            variant="primary"
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
            className="flex-1 h-10 text-xs font-semibold rounded-xl bg-[#0c0d12] hover:bg-[#1e222d] text-white cursor-pointer"
          >
            {isLoggingOut ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing out...</span>
              </span>
            ) : (
              "Logout"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function LogoutConfirmationModal({
  isOpen,
  onClose,
  triggerRef,
}: LogoutConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <LogoutModalContent onClose={onClose} triggerRef={triggerRef} />
      )}
    </AnimatePresence>
  );
}
