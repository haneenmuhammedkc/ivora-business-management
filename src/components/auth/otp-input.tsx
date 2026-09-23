"use client";

import React, { useRef, useEffect } from "react";

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true,
  className = "",
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const char = rawVal.slice(-1);

    if (char && !/^\d$/.test(char)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.length === length && !newDigits.includes("")) {
      onComplete?.(newValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const numericChars = pastedData.replace(/\D/g, "").slice(0, length);

    if (numericChars.length > 0) {
      onChange(numericChars);
      const nextIndex = Math.min(numericChars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (numericChars.length === length) {
        onComplete?.(numericChars);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-2.5">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[idx]}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${idx + 1} of ${length}`}
            className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl border bg-white text-gray-900 transition-all outline-none select-none disabled:opacity-50 disabled:bg-gray-100 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-[#0c0d12] focus:ring-2 focus:ring-gray-900/10 shadow-2xs"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-[11px] font-medium text-red-600 text-center mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
