import React from "react";

type Tone = "success" | "warning" | "danger" | "muted" | "coral";

const toneClasses: Record<Tone, string> = {
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-amber-50 text-amber-900 border-amber-300",
  danger: "bg-red-50 text-red-800 border-red-200",
  muted: "bg-surface-2 text-body border-border",
  coral: "bg-neutral-100 text-ink border-neutral-300",
};

export const StatusPill: React.FC<{ label: string; tone: Tone; className?: string }> = ({
  label,
  tone,
  className = "",
}) => (
  <span
    className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneClasses[tone]} ${className}`}
  >
    {label}
  </span>
);

export function registrationTone(status: string): Tone {
  if (status === "confirmed") return "success";
  if (status === "cancelled") return "danger";
  return "muted";
}
