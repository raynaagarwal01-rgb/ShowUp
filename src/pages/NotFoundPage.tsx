import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => (
  <main className="page-shell flex min-h-[70vh] items-center justify-center px-4 py-12">
    <section className="max-w-md text-center">
      <p className="eyebrow">404 · WRONG TURN</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">This page isn’t on the schedule.</h1>
      <p className="mt-3 text-sm text-muted">The link may have moved. You can find your next event from here.</p>
      <Link to="/events" className="btn-primary mt-6 inline-flex">Explore events</Link>
    </section>
  </main>
);
