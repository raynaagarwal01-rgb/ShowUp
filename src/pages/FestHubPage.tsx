import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Calendar,
  Compass,
  FileCheck,
  Flame,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { listEvents } from "../lib/db";
import type { EventRecord } from "../types";
import { EventCard } from "../components/EventCard";

export const FestHubPage: React.FC = () => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<"all" | "1" | "2" | "3">("all");
  const [teamOnly, setTeamOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  // Countdown timer to graVITas '26 (September 26, 2026 09:00:00 IST)
  const targetDate = useMemo(() => new Date("2026-09-26T09:00:00+05:30").getTime(), []);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  useEffect(() => {
    async function load() {
      try {
        const all = await listEvents();
        // Filter events belonging to graVITas '26
        const gravitasEvents = all.filter(
          (e) =>
            e.club_name.toLowerCase().includes("gravitas") ||
            e.id.startsWith("evt_gravitas") ||
            e.title.toLowerCase().includes("gravitas") ||
            (e.college.toLowerCase().includes("vit") &&
              (e.club_name.toLowerCase().includes("gravitas") ||
                e.tagline.toLowerCase().includes("gravitas")))
        );
        // If query returns some, use them. If none or fewer than 5 (e.g. initial demo db), fallback to VIT Vellore events
        if (gravitasEvents.length > 0) {
          setEvents(gravitasEvents);
        } else {
          setEvents(all.filter((e) => e.college.toLowerCase().includes("vit")));
        }
      } catch (err) {
        console.error("Failed to load graVITas events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ["All", "Hackathon", "Competition", "Workshop", "Cultural"];

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Category filter
      if (selectedCategory !== "All" && e.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.title.toLowerCase().includes(q) ||
          e.tagline.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.club_name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Day filter (Day 1: Sep 26, Day 2: Sep 27, Day 3: Sep 28)
      if (selectedDay !== "all") {
        const d = new Date(e.start_at);
        const dayOfMonth = d.getDate();
        // If event date corresponds to day 26, 27, 28 or index based
        if (selectedDay === "1" && dayOfMonth !== 26 && !e.title.toLowerCase().includes("day 1")) {
          // Allow flexible matching if seeded dates shifted
          const mod = Math.abs(d.getTime() % 3);
          if (dayOfMonth !== 26 && mod !== 0) return false;
        } else if (selectedDay === "2" && dayOfMonth !== 27) {
          const mod = Math.abs(d.getTime() % 3);
          if (dayOfMonth !== 27 && mod !== 1) return false;
        } else if (selectedDay === "3" && dayOfMonth !== 28) {
          const mod = Math.abs(d.getTime() % 3);
          if (dayOfMonth !== 28 && mod !== 2) return false;
        }
      }
      // Team only filter
      if (teamOnly && e.team_max <= 1) return false;
      // Free only filter
      if (freeOnly && e.fee > 0) return false;

      return true;
    });
  }, [events, selectedCategory, search, selectedDay, teamOnly, freeOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Fest Showcase */}
      <div className="relative overflow-hidden rounded-3xl border border-coral/30 bg-gradient-to-br from-[#131127] via-[#0d162e] to-[#0a0f1d] p-8 sm:p-12 shadow-2xl">
        {/* Glow backdrop effects */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-coral">
              <Flame className="h-3.5 w-3.5 animate-pulse" />
              VIT Vellore's Flagship Annual Fest
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-cream">
              graVITas <span className="text-coral">'26</span>
            </h1>

            <p className="text-base sm:text-lg text-cream/85 font-medium leading-relaxed">
              The Symphony of Technology. Experience South India's premier international collegiate
              technological festival with 56+ official competitions, 24-hour hackathons, certified
              masterclasses, and ₹5,00,000+ in grand prizes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-muted">
              <span className="flex items-center gap-1.5 text-cream">
                <Calendar className="h-4 w-4 text-coral" /> September 26 – 28, 2026
              </span>
              <span className="flex items-center gap-1.5 text-cream">
                <MapPin className="h-4 w-4 text-cyan-400" /> VIT Vellore Main Campus
              </span>
              <span className="flex items-center gap-1.5 text-cream">
                <Trophy className="h-4 w-4 text-amber-400" /> ₹5,00,000+ Prize Pool
              </span>
            </div>

            <div className="pt-3">
              <Link
                to="/campus-map"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition-colors shadow-sm"
              >
                <MapPin className="h-4 w-4 text-cyan-400" />
                Explore Campus &amp; Indoor Venue Map ↗
              </Link>
            </div>
          </div>

          {/* Countdown Clock Box */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md p-6 shadow-xl text-center space-y-3 min-w-[280px]">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">
              Fest Countdown
            </span>
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="rounded-xl bg-surface-2 p-2.5 border border-border/60">
                <div className="font-display text-2xl font-bold text-cream">
                  {String(timeLeft.days).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase text-muted font-medium">Days</div>
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5 border border-border/60">
                <div className="font-display text-2xl font-bold text-cream">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase text-muted font-medium">Hours</div>
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5 border border-border/60">
                <div className="font-display text-2xl font-bold text-cream">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase text-muted font-medium">Mins</div>
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5 border border-border/60">
                <div className="font-display text-2xl font-bold text-coral">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] uppercase text-muted font-medium">Secs</div>
              </div>
            </div>
            <div className="pt-2 text-[11px] text-muted">
              Live registrations open on Feastify
            </div>
          </div>
        </div>

        {/* Fest Perks Highlights */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/40 pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-coral/10 p-2 text-coral">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-cream">Official OD Letter</div>
              <div className="text-[11px] text-muted">For all university attendees</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-cream">Feastify Verified Cert</div>
              <div className="text-[11px] text-muted">Instant QR-verified credentials</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-cream">56+ Official Events</div>
              <div className="text-[11px] text-muted">Synchronized from Unstop &amp; VIT</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-cream">Hostel Accommodation</div>
              <div className="text-[11px] text-muted">Available on campus for external teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Controls */}
      <div className="space-y-4">
        {/* Day Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-coral" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Schedule Timeline:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDay("all")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedDay === "all"
                  ? "bg-coral text-ink shadow-md shadow-coral/15"
                  : "border border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              All 3 Days ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDay("1")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedDay === "1"
                  ? "bg-coral text-ink shadow-md shadow-coral/15"
                  : "border border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              Day 1 · Sep 26 (Fri)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDay("2")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedDay === "2"
                  ? "bg-coral text-ink shadow-md shadow-coral/15"
                  : "border border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              Day 2 · Sep 27 (Sat)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDay("3")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedDay === "3"
                  ? "bg-coral text-ink shadow-md shadow-coral/15"
                  : "border border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              Day 3 · Sep 28 (Sun)
            </button>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-surface-2 text-coral border border-coral/40"
                    : "bg-surface text-muted border border-border hover:text-cream"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Quick Toggles */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search graVITas events..."
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-cream placeholder-muted focus:border-coral focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setTeamOnly(!teamOnly)}
              className={`rounded-xl px-3 py-2 text-xs font-medium border transition-colors ${
                teamOnly
                  ? "border-coral/50 bg-coral/10 text-coral"
                  : "border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              Teams Only
            </button>

            <button
              type="button"
              onClick={() => setFreeOnly(!freeOnly)}
              className={`rounded-xl px-3 py-2 text-xs font-medium border transition-colors ${
                freeOnly
                  ? "border-coral/50 bg-coral/10 text-coral"
                  : "border-border bg-surface text-muted hover:text-cream"
              }`}
            >
              Free Entry
            </button>
          </div>
        </div>
      </div>

      {/* Events Results Count */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Showing <strong className="text-cream">{filteredEvents.length}</strong> official
          graVITas '26 events
        </span>
        {(search || selectedCategory !== "All" || teamOnly || freeOnly || selectedDay !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setSelectedDay("all");
              setTeamOnly(false);
              setFreeOnly(false);
            }}
            className="text-coral hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted">Loading graVITas '26 events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <Compass className="mx-auto h-10 w-10 text-muted/50" />
          <p className="font-display text-base font-semibold text-cream">No events match your criteria</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try clearing search keywords or switching category filters to view other events.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* FAQ & Guidelines Footer Section */}
      <div className="rounded-3xl border border-border bg-surface p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-coral" />
          <h2 className="font-display text-xl font-bold text-cream">
            graVITas '26 Attendee Guidelines &amp; FAQ
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3 text-xs leading-relaxed text-cream/80">
          <div className="space-y-2 rounded-2xl border border-border/80 bg-surface-2 p-4">
            <h3 className="font-bold text-cream text-sm flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-coral" /> OD (On-Duty) Attendance
            </h3>
            <p>
              External &amp; internal attendees receive official verified OD slips downloadable
              directly from the Feastify student dashboard post-check-in.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/80 bg-surface-2 p-4">
            <h3 className="font-bold text-cream text-sm flex items-center gap-1.5">
              <Award className="h-4 w-4 text-amber-400" /> Digital Certificates
            </h3>
            <p>
              Each registered participant gets a 1920x1080 high-res verifiable digital credential
              with cryptographic QR code authenticated by the organizers.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border/80 bg-surface-2 p-4">
            <h3 className="font-bold text-cream text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-cyan-400" /> Venue &amp; Campus Access
            </h3>
            <p>
              Check-in desks are set up at Anna Auditorium and Technology Tower (TT). Carry your
              college ID card and the Feastify Digital Ticket QR code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
