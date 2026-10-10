import React, { forwardRef } from "react";

export interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div className={`relative flex items-center w-full h-8 ${className}`}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="w-full h-1 bg-hairline rounded-[2px] appearance-none cursor-pointer accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
      </div>
    );
  },
);

Slider.displayName = "Slider";
