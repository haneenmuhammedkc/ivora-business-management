"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AuthHeader } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, ArrowRightIcon } from "@/components/ui/icons";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address (e.g., name@company.com).");
      return;
    }

    setIsSubmitting(true);
    // Simulate brief interaction before navigating to Verify OTP
    setTimeout(() => {
      router.push("/verify-otp");
    }, 400);
  };

  return (
    <AuthCard topAction="back" backHref="/login" backLabel="Back to Sign In">
      <AuthHeader
        title="Forgot Password"
        subtitle="Enter your corporate email address to receive a secure six-digit verification code."
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            CORPORATE EMAIL ADDRESS
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            icon={<MailIcon size={16} />}
            iconPosition="left"
            placeholder="name@company.com"
            className={`bg-white py-2.5 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            autoFocus
            required
          />
          {error && (
            <p className="text-[11px] font-medium text-red-600 mt-1.5">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full justify-center text-xs tracking-wider uppercase font-bold mt-2 py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg"
          icon={<ArrowRightIcon size={15} />}
          iconPosition="right"
        >
          {isSubmitting ? "Sending Code..." : "Send Verification Code"}
        </Button>

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Remember your credentials? <span className="text-[#0c0d12] underline">Sign In</span>
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
