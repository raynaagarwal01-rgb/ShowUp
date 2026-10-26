import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { listEvents } from "../lib/api";
import type { EventCategory, EventRecord } from "../types";
import { EventCard } from "../components/EventCard";

const CATEGORIES: Array<EventCategory | "All"> = ["All", "Hackathon", "Workshop", "Competition", "Cultural", "Talk"];
// shortcut: filters slice the fetched catalog in memory; add server pagination when the dataset outgrows a single fetch.
const PAGE_SIZE = 9;

export const EventsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const requestedCategory = params.get("category") ?? "All";
  const category = CATEGORIES.includes(requestedCategory as EventCategory | "All") ? requestedCategory as EventCategory | "All" : "All";
  const price = params.get("price") === "paid" ? "paid" : params.get("price") === "free" ? "free" : "all";
  const sort = params.get("sort") === "latest" ? "latest" : "soonest";
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleState, setVisibleState] = useState({ params, count: PAGE_SIZE });
  const visible = visibleState.params === params ? visibleState.count : PAGE_SIZE;
  const requestId = useRef(0);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "All" || value === "all" || (key === "sort" && value === "soonest")) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const load = () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    listEvents().then((result) => {
      if (currentRequest === requestId.current) setEvents(result);
    }).catch((e: unknown) => {
      if (currentRequest === requestId.current) setError(e instanceof Error ? e.message : "Events could not be loaded.");
    }).finally(() => {
      if (currentRequest === requestId.current) setLoading(false);
    });
  };
  useEffect(() => {
    load();
    return () => { requestId.current++; };
  }, []);
  const filtered = useMemo(() => events.filter((event) => {
    if (category !== "All" && event.category !== category) return false;
    if (price === "free" && event.fee !== 0) return false;
    if (price === "paid" && event.fee === 0) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${event.title} ${event.organizer_name} ${event.organizer_college ?? ""} ${event.venue} ${event.description}`.toLowerCase().includes(needle);
  }).sort((a, b) => (new Date(a.event_date).getTime() - new Date(b.event_date).getTime()) * (sort === "latest" ? -1 : 1)), [events, category, price, query, sort]);

  return <main className="page-shell py-10 sm:py-14">
    <header className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">ShowUp / Events</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Explore events.</h1>
      <p className="mt-3 text-base text-muted">Find workshops, competitions and campus gatherings worth your time.</p>
    </header>

    <section aria-label="Find events" className="mt-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="field pl-10" type="search" value={query} onChange={(e) => update("q", e.target.value)} placeholder="Search events, colleges, or venues" />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only">Price</span>
          <select className="field min-h-10 sm:w-36" value={price} onChange={(e) => update("price", e.target.value)} aria-label="Price">
            <option value="all">Any price</option><option value="free">Free</option><option value="paid">Paid</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only">Sort events</span>
          <select className="field min-h-10 sm:w-48" value={sort} onChange={(e) => update("sort", e.target.value)} aria-label="Sort events">
            <option value="soonest">Soonest first</option><option value="latest">Latest first</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Event category">
        {CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => update("category", item)} className={`min-h-10 shrink-0 rounded-md border px-4 text-sm transition-colors ${category === item ? "border-ink bg-ink text-white" : "border-border bg-white text-body hover:bg-surface-2"}`}>{item}</button>)}
      </div>
    </section>

    <section className="mt-8" aria-live="polite">
      <div className="mb-4 flex items-center justify-between text-sm text-muted"><p>{loading ? "Loading events…" : `${filtered.length} ${filtered.length === 1 ? "event" : "events"}`}</p></div>
      {error ? <div className="panel p-6" role="alert"><p className="font-medium">Events could not be loaded.</p><p className="mt-1 text-sm text-muted">{error}</p><button type="button" onClick={load} className="btn-secondary mt-4 min-h-10 rounded-md">Try again</button></div>
        : loading ? <p className="py-12 text-center text-sm text-muted">Loading events…</p>
        : filtered.length === 0 ? <div className="panel py-14 text-center"><p className="font-medium">No events found.</p><p className="mt-1 text-sm text-muted">Try another search or clear your filters.</p><button type="button" className="mt-4 text-sm underline" onClick={() => setParams({}, { replace: true })}>Clear filters</button></div>
        : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, visible).map((event) => <EventCard key={event.id} event={event} />)}</div>
          {visible < filtered.length && <div className="mt-8 text-center"><button type="button" className="btn-secondary min-h-10 rounded-md" onClick={() => setVisibleState({ params, count: visible + PAGE_SIZE })}>Load more events</button></div>}
          <p className="mt-4 text-center text-xs text-muted">Showing {Math.min(visible, filtered.length)} of {filtered.length}</p></>}
    </section>
  </main>;
};
