"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard, AuthHeader, OTPInput } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, RefreshCwIcon, CheckIcon } from "@/components/ui/icons";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "ACCOUNT_ACTIVATION";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    setError("");

    if (code.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!email) {
      setError("Email address is missing from the verification request. Please return to login.");
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
          type,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        if (type === "PASSWORD_RESET") {
          router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(code)}`);
        } else {
          // Account activation successful! The restricted session cookie is issued.
          // The partner proceeds DIRECTLY to the mandatory password change page.
          router.push("/reset-password");
        }
      } else {
        setError(data.error || "Verification failed. Please check the code and try again.");
      }
    } catch {
      setError("A network error occurred during verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendStatus(null);

    if (!email) {
      setError("Email address is missing. Please return to login.");
      return;
    }

    try {
      if (type === "PASSWORD_RESET") {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
      setResendStatus("New code dispatched to your email");
      setOtp("");
      setTimeout(() => {
        setResendStatus(null);
      }, 4000);
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <AuthCard topAction="back" backHref="/login" backLabel="Back to Sign In">
      <AuthHeader
        title="Verify OTP"
        subtitle={
          email
            ? `Enter the six-digit verification code sent to ${email}.`
            : "Enter the six-digit verification code sent to your registered corporate email."
        }
      />

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
              SECURITY CODE
            </span>
            <span className="text-[10px] font-semibold text-gray-400">
              EXPIRES IN 10 MIN
            </span>
          </div>

          <OTPInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (error) setError("");
            }}
            onComplete={(val) => {
              handleVerify(val);
            }}
            error={error}
            autoFocus
          />
        </div>

        {resendStatus && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckIcon size={14} className="text-emerald-600 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isVerifying || otp.length < 6}
          onClick={() => handleVerify()}
          className="w-full justify-center text-xs tracking-wider uppercase font-bold py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg cursor-pointer"
          icon={<ArrowRightIcon size={15} />}
          iconPosition="right"
        >
          {isVerifying ? "Verifying..." : "Verify & Proceed"}
        </Button>

        <div className="flex flex-col items-center justify-center gap-2 pt-1 text-center">
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 transition-colors cursor-pointer select-none"
          >
            <RefreshCwIcon size={12} className="text-gray-500" />
            Didn&apos;t receive the code? <span className="underline font-bold">Resend OTP</span>
          </button>

          <Link
            href="/login"
            className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mt-2"
          >
            Cancel & Return to <span className="underline">Sign In</span>
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
