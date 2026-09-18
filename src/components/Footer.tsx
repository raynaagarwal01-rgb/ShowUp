import React from "react";
import { Logo } from "./Logo";

export const Footer: React.FC = () => (
  <footer className="border-t border-border/80 py-8">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:text-left">
      <Logo />
      <p className="text-xs text-muted">
        One login, one dashboard, every college's events across India — not just a single fest.
      </p>
    </div>
  </footer>
);
