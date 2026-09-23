import React from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Input } from "@/components/ui/input";
import { MailIcon } from "@/components/ui/icons";

export interface PartnerLoginAccessFormData {
  loginEmail: string;
  temporaryPassword: string;
  confirmTemporaryPassword: string;
}

export interface PartnerAccessSectionProps {
  data: PartnerLoginAccessFormData;
  onChange: (field: keyof PartnerLoginAccessFormData, value: string) => void;
  errors: Partial<Record<keyof PartnerLoginAccessFormData, string>>;
}

export function PartnerAccessSection({
  data,
  onChange,
  errors,
}: PartnerAccessSectionProps) {
  const hasMinLength = data.temporaryPassword.length >= 8;
  const hasNumber = /\d/.test(data.temporaryPassword);
  const hasLetter = /[a-zA-Z]/.test(data.temporaryPassword);
  const passwordsMatch =
    data.temporaryPassword &&
    data.confirmTemporaryPassword &&
    data.temporaryPassword === data.confirmTemporaryPassword;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-wide">
          2. Partner Login Access & Temporary Credentials
        </h2>
        <p className="text-[11px] text-gray-500 font-normal mt-0.5">
          Create the initial credentials the partner will use to access their partitioned Ivora dashboard.
        </p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">

        {/* Login Email */}
        <div>
          <label
            htmlFor="loginEmail"
            className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            LOGIN IDENTIFIER (EMAIL) <span className="text-red-500">*</span>
          </label>
          <Input
            id="loginEmail"
            type="email"
            value={data.loginEmail}
            onChange={(e) => onChange("loginEmail", e.target.value)}
            icon={<MailIcon size={16} />}
            iconPosition="left"
            placeholder="name@partner-firm.ae"
            className={errors.loginEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            required
          />
          {errors.loginEmail ? (
            <p className="text-[11px] font-medium text-red-600 mt-1">
              {errors.loginEmail}
            </p>
          ) : (
            <p className="text-[11px] text-gray-500 mt-1.5 leading-normal">
              Login email must match the Corporate Email provided above.
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <PasswordInput
              id="temporaryPassword"
              label="INITIAL TEMPORARY PASSWORD *"
              value={data.temporaryPassword}
              onChange={(e) => onChange("temporaryPassword", e.target.value)}
              placeholder="Min. 8 chars (letters & numbers)"
              error={errors.temporaryPassword}
              required
            />
          </div>

          <div>
            <PasswordInput
              id="confirmTemporaryPassword"
              label="CONFIRM TEMPORARY PASSWORD *"
              value={data.confirmTemporaryPassword}
              onChange={(e) => onChange("confirmTemporaryPassword", e.target.value)}
              placeholder="Re-enter temporary password"
              error={errors.confirmTemporaryPassword}
              required
            />
          </div>
        </div>

        {/* Live Password Requirement Indicators */}
        <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            TEMPORARY PASSWORD REQUIREMENTS
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
                  : data.confirmTemporaryPassword
                  ? "text-red-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                  passwordsMatch
                    ? "bg-emerald-100 text-emerald-700"
                    : data.confirmTemporaryPassword
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {passwordsMatch ? "✓" : data.confirmTemporaryPassword ? "✕" : "•"}
              </div>
              <span>Passwords match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
