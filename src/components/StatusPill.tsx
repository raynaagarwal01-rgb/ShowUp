import React from "react";

type Tone = "success" | "warning" | "danger" | "muted" | "coral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  muted: "bg-white/5 text-muted border-border",
  coral: "bg-coral/15 text-coral-light border-coral/30",
};

export const StatusPill: React.FC<{ label: string; tone: Tone; className?: string }> = ({
  label,
  tone,
  className = "",
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
  >
    {label}
  </span>
);

export function registrationTone(status: string): Tone {
  if (status === "confirmed") return "success";
  if (status === "waitlisted") return "warning";
  if (status === "cancelled") return "danger";
  return "muted";
}
