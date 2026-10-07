"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard, AuthHeader, PasswordInput } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { CheckIcon, ArrowRightIcon } from "@/components/ui/icons";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const otpParam = searchParams.get("otp") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules matching backend validatePasswordStrength
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("Password must include uppercase, lowercase letters, and at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      let res: Response;
      if (emailParam && otpParam) {
        // Forgot password / OTP reset flow
        res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailParam,
            otp: otpParam,
            newPassword: password,
          }),
        });
      } else {
        // First-login mandatory password change flow (authenticated via session cookie)
        res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPassword: password,
          }),
          credentials: "include",
        });
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || "Failed to update password. Please try again.");
      }
    } catch {
      setError("A network error occurred while updating password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
              Password Updated Successfully
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
              Your security credentials have been updated successfully. You can now access your corporate workspace.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => router.push(emailParam ? "/login" : "/dashboard")}
            className="w-full justify-center text-xs tracking-wider uppercase font-bold py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg mt-4 cursor-pointer"
            icon={<ArrowRightIcon size={15} />}
            iconPosition="right"
          >
            {emailParam ? "Sign In Now" : "Proceed to Dashboard"}
          </Button>

          <div className="pt-1 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Return to <span className="text-[#0c0d12] underline">Sign In</span>
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard topAction="back" backHref="/login" backLabel="Cancel">
      <AuthHeader
        title={emailParam ? "Reset Password" : "Set New Password"}
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
            <div
              className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : "text-gray-500"}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  hasMinLength ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                }`}
              >
                {hasMinLength ? "✓" : "•"}
              </div>
              <span>At least 8 characters long</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasUpperCase && hasLowerCase && hasNumber ? "text-emerald-700 font-medium" : "text-gray-500"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  hasUpperCase && hasLowerCase && hasNumber
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {hasUpperCase && hasLowerCase && hasNumber ? "✓" : "•"}
              </div>
              <span>Includes uppercase, lowercase, and numbers</span>
            </div>
            {confirmPassword && (
              <div
                className={`flex items-center gap-1.5 ${
                  passwordsMatch ? "text-emerald-700 font-medium" : "text-red-600 font-medium"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                    passwordsMatch ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}
                >
                  {passwordsMatch ? "✓" : "✕"}
                </div>
                <span>Passwords match</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center text-xs tracking-wider uppercase font-bold mt-2 py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg cursor-pointer"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
