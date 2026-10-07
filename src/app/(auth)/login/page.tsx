"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth";
import {
  MailIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
} from "@/components/ui/icons";
import { validateLoginInput, LoginFieldErrors } from "@/validators/auth.validator";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});

    const validation = validateLoginInput({ email, password });

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      if (validation.errors.email) {
        emailInputRef.current?.focus();
      } else if (validation.errors.password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(validation.data.email, validation.data.password);

      if (res.success) {
        if (res.requiresActivationOtp) {
          router.push(`/verify-otp?email=${encodeURIComponent(validation.data.email)}`);
        } else if (res.requiresPasswordChange) {
          router.push("/reset-password");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(res.error || "Invalid email or password");
        setIsSubmitting(false);
      }
    } catch {
      setError("An unexpected error occurred during login. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Right Help Action */}
      <div className="absolute top-8 right-8">
        <a
          href="#help"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HelpCircleIcon size={14} />
          Need Help?
        </a>
      </div>

      {/* Login Card with pale blue-gray surface and generous rounding */}
      <div className="w-full max-w-[440px] rounded-3xl bg-[#f0f4f8] p-8 sm:p-10 shadow-xl shadow-slate-200/40 border border-[#e2e8f0]">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0c0d12]">
            Welcome Back
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium">
            Sign in to manage your corporate workspace
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50/90 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              EMAIL OR USERNAME
            </label>
            <Input
              ref={emailInputRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
                if (error) setError("");
              }}
              icon={<MailIcon size={16} />}
              iconPosition="left"
              placeholder="name@company.com"
              error={errors.email}
              className="bg-white py-2.5"
              autoFocus
              required
            />
          </div>

          <div>
            <PasswordInput
              ref={passwordInputRef}
              id="password"
              label="PASSWORD"
              labelRight={
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </Link>
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
                if (error) setError("");
              }}
              placeholder="Enter password"
              error={errors.password}
              className="bg-white py-2.5"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-xs text-gray-700 font-medium">Remember me for 30 days</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full justify-center text-xs tracking-wider uppercase font-bold mt-2 py-3.5 bg-[#0c0d12] hover:bg-[#1f2430] rounded-lg cursor-pointer"
            icon={<ArrowRightIcon size={15} />}
            iconPosition="right"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </div>

      {/* Security Footer Note */}
      <div className="mt-12 flex items-center gap-2 text-xs text-gray-500 font-medium">
        <ShieldCheckIcon size={15} className="text-gray-400" />
        <span>Bank-grade 256-bit SSL encryption. Authorized access only.</span>
      </div>
    </div>
  );
}
