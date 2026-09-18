import React from "react";
import { ArrowUpRight } from "lucide-react";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-2 font-display tracking-tight ${className}`}>
    <span className="relative grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-tr from-coral to-amber-400 text-ink shadow-sm shadow-coral/30">
      <ArrowUpRight className="h-4 w-4" strokeWidth={3} />
      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-ink animate-pulse" />
    </span>
    <span className="text-xl font-extrabold text-cream">
      Show<span className="text-coral">Up</span>
    </span>
  </span>
);
