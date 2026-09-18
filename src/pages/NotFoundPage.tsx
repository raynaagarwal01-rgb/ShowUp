import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => (
  <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-6xl font-extrabold text-coral">404</p>
    <p className="mt-3 text-cream/80">This page wandered off campus.</p>
    <Link to="/" className="mt-5 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-ink">
      Back home
    </Link>
  </div>
);
