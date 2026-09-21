import React from "react";
import { SearchIcon } from "./icons";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      iconPosition = "left",
      helperText,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-2xs">
          {icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500 ${
              icon && iconPosition === "left" ? "pl-9" : ""
            } ${icon && iconPosition === "right" ? "pr-9" : ""} ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
            } ${className}`}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {helperText && !error && (
          <p className="mt-1 text-[11px] text-gray-500">{helperText}</p>
        )}
        {error && <p className="mt-1 text-[11px] text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface SearchInputProps extends Omit<InputProps, "icon" | "iconPosition"> {
  placeholder?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = "Search...", className = "", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        icon={<SearchIcon size={14} className="text-gray-400" />}
        iconPosition="left"
        className={`bg-white ${className}`}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
