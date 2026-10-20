import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Bookmark, Building2, Calendar, Search, SlidersHorizontal, X } from "lucide-react";
import { listEvents } from "../lib/api";
import type { EventCategory, EventRecord } from "../types";
import { EventCard } from "../components/EventCard";
import { useBookmarks } from "../lib/bookmarks";

const CATEGORIES: Array<EventCategory | "All"> = [
  "All",
  "Hackathon",
  "Workshop",
  "Competition",
  "Cultural",
  "Talk",
];

const ALL_COLLEGES = "All Colleges";

export type DateSort = "date_asc" | "date_desc" | "deadline_asc";

function distinctSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

type PriceFilter = "all" | "free" | "paid";
type TeamFilter = "all" | "solo" | "team";

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [college, setCollege] = useState(ALL_COLLEGES);
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const { bookmarkedIds } = useBookmarks();
  const [price, setPrice] = useState<PriceFilter>("all");
  const [team, setTeam] = useState<TeamFilter>("all");
  const [sortBy, setSortBy] = useState<DateSort>("date_asc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  // Colleges come from each event's organizer (users.college via the JOIN).
  const colleges = useMemo(
    () => distinctSorted(events.map((e) => e.organizer_college).filter((c): c is string => Boolean(c))),
    [events],
  );

  const filtered = useMemo(() => {
    const list = events.filter((e) => {
      if (college !== ALL_COLLEGES && e.organizer_college !== college) return false;
      if (category !== "All" && e.category !== category) return false;
      if (price === "free" && e.fee > 0) return false;
      if (price === "paid" && e.fee === 0) return false;
      if (team === "solo" && e.team_max > 1) return false;
      if (team === "team" && e.team_max <= 1) return false;
      if (fromDate) {
        const fromTime = new Date(fromDate + "T00:00:00").getTime();
        if (new Date(e.event_date).getTime() < fromTime) return false;
      }
      if (toDate) {
        const toTime = new Date(toDate + "T23:59:59").getTime();
        if (new Date(e.event_date).getTime() > toTime) return false;
      }
      if (showSavedOnly && !bookmarkedIds.includes(e.id)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = `${e.title} ${e.organizer_name} ${e.organizer_college ?? ""} ${e.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      const time = (iso: string) => new Date(iso).getTime();
      if (sortBy === "date_desc") return time(b.event_date) - time(a.event_date);
      if (sortBy === "deadline_asc") return time(a.registration_deadline) - time(b.registration_deadline);
      return time(a.event_date) - time(b.event_date);
    });
  }, [events, college, category, price, team, query, sortBy, fromDate, toDate, showSavedOnly, bookmarkedIds]);

  const scopeLabel = college !== ALL_COLLEGES ? `at ${college}` : "across all colleges";
  const dateLabel =
    fromDate && toDate
      ? ` between ${new Date(fromDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })} and ${new Date(toDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : fromDate
      ? ` from ${new Date(fromDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })} onwards`
      : toDate
      ? ` up to ${new Date(toDate + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Events</h1>
          <p className="text-cream/70">
            {filtered.length} {filtered.length === 1 ? "event" : "events"} {scopeLabel}
            {dateLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <ArrowUpDown className="h-3.5 w-3.5 text-coral" /> Sort by:
          </span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DateSort)}
              className="appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-8 text-xs font-medium text-cream focus:border-coral focus:outline-none cursor-pointer hover:border-coral/40"
            >
              <option value="date_asc">Event Date: Soonest First</option>
              <option value="date_desc">Event Date: Latest First</option>
              <option value="deadline_asc">Deadline: Closing Soonest</option>
            </select>
            <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-56">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coral" />
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full appearance-none rounded-xl border border-coral/40 bg-surface py-2.5 pl-9 pr-3 text-sm font-medium text-cream focus:border-coral focus:outline-none"
            >
              <option value={ALL_COLLEGES}>{ALL_COLLEGES}</option>
              {colleges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, clubs or colleges"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-cream placeholder:text-muted focus:border-coral focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium sm:hidden ${
              filtersOpen ? "border-coral text-coral" : "border-border text-cream/80"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className={`${filtersOpen ? "flex" : "hidden"} flex-col gap-3 sm:flex`}>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c && !showSavedOnly
                    ? "border-coral bg-coral/15 text-coral-light"
                    : "border-border text-cream/70 hover:border-coral/40"
                }`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setShowSavedOnly((s) => !s)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                showSavedOnly
                  ? "border-coral bg-coral text-ink font-semibold shadow-sm"
                  : "border-border text-cream/70 hover:border-coral/40"
              }`}
            >
              <Bookmark className={`h-3 w-3 ${showSavedOnly ? "fill-current" : ""}`} />
              Saved {bookmarkedIds.length > 0 ? `(${bookmarkedIds.length})` : ""}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={price}
              onChange={setPrice}
              options={[
                { value: "all", label: "Any price" },
                { value: "free", label: "Free" },
                { value: "paid", label: "Paid" },
              ]}
            />
            <SegmentedControl
              value={team}
              onChange={setTeam}
              options={[
                { value: "all", label: "Solo or team" },
                { value: "solo", label: "Solo only" },
                { value: "team", label: "Team only" },
              ]}
            />

            {/* Calendar Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1 text-xs text-cream focus-within:border-coral/60 transition-colors">
              <Calendar className="h-4 w-4 text-coral shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    if (toDate && e.target.value > toDate) {
                      setToDate(e.target.value);
                    }
                  }}
                  className="rounded-lg border border-border/60 bg-ink/40 px-2 py-1 text-xs text-cream focus:border-coral focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted">To</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-border/60 bg-ink/40 px-2 py-1 text-xs text-cream focus:border-coral focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="flex items-center gap-1 rounded-md bg-coral/15 px-2 py-1 text-[11px] font-medium text-coral hover:bg-coral/25 transition-colors"
                  title="Clear date filter"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted">Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-cream/80">No events match those filters.</p>
            <p className="mt-1 text-sm text-muted">Try a different category, college, or date range.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value ? "bg-coral text-ink" : "text-cream/70 hover:text-cream"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
