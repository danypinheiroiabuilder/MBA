"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={[
        "h-10 w-full rounded-2xl border border-border bg-card/40 px-3 text-sm text-text placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      ].join(" ")}
    />
  ),
);
Input.displayName = "Input";

