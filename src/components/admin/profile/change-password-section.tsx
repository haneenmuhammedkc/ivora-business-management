"use client";

import React, { useState } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRightIcon } from "@/components/ui/icons";

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword.trim()) {
      setError("Please enter your current administrator password.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (!hasMinLength) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!hasLetter || !hasNumber) {
      setError("New password must contain both letters and numbers.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage("Password change request ready. Updated in current session.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }, 400);
  };

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          Change Account Password
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Update your administrator credentials. Passwords must satisfy enterprise security complexity.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mx-5 mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckIcon size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Body Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <PasswordInput
              id="current-password"
              label="CURRENT PASSWORD"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <PasswordInput
              id="new-password"
              label="NEW PASSWORD"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Min. 8 chars, letters & nums"
              required
            />
          </div>

          <div>
            <PasswordInput
              id="confirm-new-password"
              label="CONFIRM NEW PASSWORD"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Re-enter new password"
              required
            />
          </div>
        </div>

        {/* Password Strength Requirement Indicators */}
        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            PASSWORD REQUIREMENTS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div
              className={`flex items-center gap-1.5 ${
                hasMinLength ? "text-emerald-700 font-medium" : "text-gray-500"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  hasMinLength
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {hasMinLength ? "✓" : "•"}
              </div>
              <span>At least 8 characters</span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                hasLetter && hasNumber
                  ? "text-emerald-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  hasLetter && hasNumber
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {hasLetter && hasNumber ? "✓" : "•"}
              </div>
              <span>Letters & numbers</span>
            </div>

            <div
              className={`flex items-center gap-1.5 ${
                passwordsMatch
                  ? "text-emerald-700 font-medium"
                  : confirmPassword
                  ? "text-red-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  passwordsMatch
                    ? "bg-emerald-100 text-emerald-700"
                    : confirmPassword
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {passwordsMatch ? "✓" : confirmPassword ? "✕" : "•"}
              </div>
              <span>Passwords match</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            icon={<ArrowRightIcon size={14} />}
            iconPosition="right"
            className="text-xs font-bold uppercase tracking-wider"
          >
            {isSubmitting ? "Processing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
