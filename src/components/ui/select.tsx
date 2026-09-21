import React from "react";
import { ChevronDownIcon } from "./icons";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  prefixLabel?: string;
  className?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, prefixLabel, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative inline-block w-full">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {prefixLabel ? `${prefixLabel}: ${option.label}` : option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500">
            <ChevronDownIcon size={13} />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
