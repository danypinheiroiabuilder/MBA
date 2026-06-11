"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      className={[
        "h-10 w-full appearance-none rounded-2xl border border-border bg-card/40 px-3 text-sm text-text",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

