import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export const Footer: React.FC = () => (
  <footer className="border-t border-[#ebebeb] bg-white py-7">
    <div className="page-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Link to="/" aria-label="ShowUp home"><Logo /></Link>
      <p className="text-sm text-[#666]">Find your people. Find your next event.</p>
      <Link to="/events" className="text-sm font-medium text-ink underline decoration-[#b8b8b8] underline-offset-4 hover:decoration-ink">Browse events</Link>
    </div>
  </footer>
);
