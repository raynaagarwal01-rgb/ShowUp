import React from "react";
import { TicketCheck } from "lucide-react";

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`inline-flex items-center gap-2.5 font-display ${className}`}>
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">
      <TicketCheck aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </span>
    <span className="text-[19px] font-semibold tracking-[-0.7px] text-ink">ShowUp</span>
  </span>
);
