import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { listEvents } from "../lib/db";
import type { EventCategory, EventRecord } from "../types";
import { EventCard } from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

const CATEGORIES: Array<EventCategory | "All"> = [
  "All",
  "Hackathon",
  "Workshop",
  "Competition",
  "Cultural",
  "Talk",
];

const ALL_CITIES = "All India";

type PriceFilter = "all" | "free" | "paid";
type TeamFilter = "all" | "solo" | "team";

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(ALL_CITIES);
  const [cityTouched, setCityTouched] = useState(false);
  const [category, setCategory] = useState<EventCategory | "All">("All");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [team, setTeam] = useState<TeamFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(events.map((e) => e.city))).sort(),
    [events],
  );

  // Default the city filter to the signed-in user's home city the first time
  // it becomes available, without overriding a choice they've already made.
  useEffect(() => {
    if (cityTouched || !user?.city) return;
    const match = cities.find((c) => c.toLowerCase() === user.city!.toLowerCase());
    if (match) setCity(match);
  }, [cities, user?.city, cityTouched]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (city !== ALL_CITIES && e.city !== city) return false;
      if (category !== "All" && e.category !== category) return false;
      if (price === "free" && e.fee > 0) return false;
      if (price === "paid" && e.fee === 0) return false;
      if (team === "solo" && e.team_max > 1) return false;
      if (team === "team" && e.team_max <= 1) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = `${e.title} ${e.club_name} ${e.tagline}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [events, city, category, price, team, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Events</h1>
        <p className="text-cream/70">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}{" "}
          {city === ALL_CITIES ? "across India" : `in ${city}`}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-56">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coral" />
            <select
              value={city}
              onChange={(e) => {
                setCityTouched(true);
                setCity(e.target.value);
              }}
              className="w-full appearance-none rounded-xl border border-coral/40 bg-surface py-2.5 pl-9 pr-3 text-sm font-medium text-cream focus:border-coral focus:outline-none"
            >
              <option value={ALL_CITIES}>{ALL_CITIES}</option>
              {cities.map((c) => (
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
              placeholder="Search events or clubs"
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
                  category === c
                    ? "border-coral bg-coral/15 text-coral-light"
                    : "border-border text-cream/70 hover:border-coral/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted">Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-cream/80">No events match those filters.</p>
            <p className="mt-1 text-sm text-muted">Try clearing a filter or searching something else.</p>
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
