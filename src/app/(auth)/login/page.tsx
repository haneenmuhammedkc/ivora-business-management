"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  HelpCircleIcon,
} from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@ivora.trade");
  const [password, setPassword] = useState("DemoSecurePass123");
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Right Help Action */}
      <div className="absolute top-6 right-6">
        <a
          href="#help"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HelpCircleIcon size={14} />
          Need Help?
        </a>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Sign in to manage your corporate workspace
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
            >
              EMAIL OR USERNAME
            </label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<MailIcon size={16} />}
              iconPosition="left"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider"
              >
                PASSWORD
              </label>
              <a
                href="#forgot-password"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<LockIcon size={16} />}
                iconPosition="left"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span className="text-xs text-gray-600">Remember me for 30 days</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center text-xs tracking-wider uppercase font-bold mt-2"
            icon={<ArrowRightIcon size={15} />}
            iconPosition="right"
          >
            Sign In
          </Button>
        </form>
      </div>

      {/* Security Footer Note */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <ShieldCheckIcon size={15} className="text-gray-400" />
        <span>Bank-grade 256-bit SSL encryption. Authorized access only.</span>
      </div>
    </div>
  );
}
