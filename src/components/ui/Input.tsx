import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tabular?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", tabular, className = "", disabled, ...props }, ref) => {
    const isNumeric = type === "number" || tabular;
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={`h-8 w-full px-2.5 text-sm bg-paper text-graphite border border-hairline rounded-[2px] placeholder:text-pencil transition-colors duration-fast focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${
          isNumeric ? "tabular-nums font-mono" : ""
        } ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
