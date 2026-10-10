import React, { forwardRef, useState } from "react";

export interface ToggleProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: "sm" | "default";
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      pressed: controlledPressed,
      defaultPressed = false,
      onPressedChange,
      size = "default",
      className = "",
      disabled,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledPressed, setUncontrolledPressed] =
      useState(defaultPressed);
    const isPressed =
      controlledPressed !== undefined ? controlledPressed : uncontrolledPressed;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (disabled) return;
      const next = !isPressed;
      if (controlledPressed === undefined) {
        setUncontrolledPressed(next);
      }
      onPressedChange?.(next);
    };

    const sizeClass = size === "sm" ? "h-7 text-xs px-2.5" : "h-8 text-sm px-3";

    return (
      <button
        ref={ref}
        type="button"
        role="button"
        aria-pressed={isPressed}
        disabled={disabled}
        onClick={handleClick}
        className={`inline-flex items-center justify-center font-medium rounded-[2px] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${
          isPressed
            ? "bg-accent text-paper"
            : "bg-plaster text-graphite border border-hairline hover:bg-[#e6e8e5]"
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Toggle.displayName = "Toggle";
