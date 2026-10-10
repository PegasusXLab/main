import React, { forwardRef } from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-xs font-medium text-pencil tracking-wider uppercase select-none ${className}`}
        {...props}
      >
        {children}
      </label>
    );
  },
);

Label.displayName = "Label";
