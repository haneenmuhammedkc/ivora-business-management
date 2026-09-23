"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthHeader, OTPInput } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, RefreshCwIcon, CheckIcon } from "@/components/ui/icons";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    setError("");

    if (code.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      router.push("/reset-password");
    }, 400);
  };

  const handleResend = () => {
    setResendStatus("New code dispatched to your email");
    setOtp("");
    setError("");
    setTimeout(() => {
      setResendStatus(null);
    }, 4000);
  };

  return (
    <AuthCard topAction="back" backHref="/forgot-password" backLabel="Change Email">
      <AuthHeader
        title="Verify OTP"
        subtitle="Enter the six-digit verification code sent to your registered corporate email."
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

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isVerifying || otp.length < 6}
          onClick={() => handleVerify()}
          className="w-full justify-center text-xs tracking-wider uppercase font-bold py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg"
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
