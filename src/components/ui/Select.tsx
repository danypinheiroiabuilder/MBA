"use client";

import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-10 w-full appearance-none rounded-2xl border border-border bg-card/40 px-3 text-sm text-text",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      ].join(" ")}
    >
      {children}
    </select>
  );
}

