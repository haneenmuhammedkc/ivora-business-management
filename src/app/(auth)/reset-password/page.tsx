"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthHeader, PasswordInput } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRightIcon } from "@/components/ui/icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (!hasMinLength) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!hasLetter || !hasNumber) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  if (isSuccess) {
    return (
      <AuthCard topAction="none">
        <div className="text-center py-4 space-y-6">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckIcon size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c0d12] tracking-tight">
              Password Reset Complete
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
              Your security credentials have been updated successfully. You may now sign in with your new password.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => router.push("/login")}
            className="w-full justify-center text-xs tracking-wider uppercase font-bold py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg mt-4"
            icon={<ArrowRightIcon size={15} />}
            iconPosition="right"
          >
            Sign In Now
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard topAction="back" backHref="/login" backLabel="Cancel">
      <AuthHeader
        title="Reset Password"
        subtitle="Create a strong, unique password for your Ivora corporate account."
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordInput
          id="new-password"
          label="NEW PASSWORD"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="Enter new password (min. 8 chars)"
          autoFocus
          required
        />

        <PasswordInput
          id="confirm-password"
          label="CONFIRM NEW PASSWORD"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="Re-enter your new password"
          required
        />

        {/* Password Strength Requirements Helper */}
        <div className="p-3.5 rounded-xl bg-white/80 border border-gray-200/80 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            PASSWORD REQUIREMENTS
          </span>
          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : "text-gray-500"}`}>
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {hasMinLength ? "✓" : "•"}
              </div>
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? "text-emerald-700 font-medium" : "text-gray-500"}`}>
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLetter && hasNumber ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {hasLetter && hasNumber ? "✓" : "•"}
              </div>
              <span>Includes letters and numbers</span>
            </div>
            {confirmPassword && (
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordsMatch ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                  {passwordsMatch ? "✓" : "✕"}
                </div>
                <span>Passwords match</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-medium text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center text-xs tracking-wider uppercase font-bold mt-2 py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg"
          icon={<ArrowRightIcon size={15} />}
          iconPosition="right"
        >
          {isSubmitting ? "Updating Password..." : "Update Password"}
        </Button>

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel and return to <span className="text-[#0c0d12] underline">Sign In</span>
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
