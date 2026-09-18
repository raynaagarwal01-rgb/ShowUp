import React from "react";
import { UtensilsCrossed } from "lucide-react";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 font-display font-bold tracking-tight ${className}`}>
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral text-ink">
      <UtensilsCrossed className="h-4 w-4" strokeWidth={2.5} />
    </span>
    Feast<span className="text-coral">ify</span>
  </span>
);
