import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode, Users2, Ticket, LayoutDashboard, ArrowRight, Sparkles } from "lucide-react";
import { listEvents } from "../lib/db";
import type { EventRecord } from "../types";
import { EventCard } from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: Ticket,
    title: "Register once, reuse everywhere",
    body: "Your profile carries over to every club's event — no retyping your name and phone number on the tenth Google Form of the semester.",
  },
  {
    icon: Users2,
    title: "Solo or team, built in",
    body: "Create a team and share a join code, or register solo. Capacity and waitlisting are handled automatically for both.",
  },
  {
    icon: QrCode,
    title: "QR check-in at the door",
    body: "Every registration gets a scannable ticket. Organizers check people in with a phone camera — no paper lists.",
  },
  {
    icon: LayoutDashboard,
    title: "One dashboard, not two portals",
    body: "Browsing, signing up, and managing your tickets all live in the same place — nothing hands you off to a different-looking site.",
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);

  useEffect(() => {
    listEvents().then((all) => setEvents(all.slice(0, 3)));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 0%, rgba(255,107,71,0.25), transparent 60%), radial-gradient(500px circle at 90% 20%, rgba(176,107,255,0.2), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-xs font-medium text-coral-light">
            <Sparkles className="h-3.5 w-3.5" /> Built for every college across India
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl">
            Every college event in India, <span className="text-coral">one place</span> to register.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-cream/70">
            Feastify replaces the pile of Google Forms and WhatsApp links your clubs use today
            with one login, real-time seats, QR check-in, and a dashboard organizers actually
            enjoy using.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/events"
              className="flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              Browse events <ArrowRight className="h-4 w-4" />
            </Link>
            {!user && (
              <Link
                to="/signup"
                className="flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-cream/90 hover:border-coral/50"
              >
                Host an event
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          What actually changes for your club
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
              <f.icon className="h-6 w-6 text-coral" />
              <h3 className="mt-3 font-display font-semibold text-cream">{f.title}</h3>
              <p className="mt-1.5 text-sm text-cream/70">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Happening soon</h2>
            <Link to="/events" className="flex items-center gap-1 text-sm font-medium text-coral">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
