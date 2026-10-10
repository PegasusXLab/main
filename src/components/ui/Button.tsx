import React, { forwardRef } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "default" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "bg-plaster text-graphite border border-hairline hover:bg-[#e6e8e5] active:scale-[0.98]",
  outline:
    "bg-transparent text-graphite border border-hairline hover:bg-plaster active:scale-[0.98]",
  ghost: "bg-transparent text-graphite hover:bg-plaster active:scale-[0.98]",
  destructive: "bg-danger text-paper hover:bg-danger-hover active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 text-xs px-2.5",
  default: "h-8 text-sm px-3",
  icon: "h-8 w-8 p-0 flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "default",
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-medium rounded-[2px] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
