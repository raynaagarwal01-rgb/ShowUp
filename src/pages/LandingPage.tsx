import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, QrCode, Ticket } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  { icon: CalendarDays, title: "Find an event", body: "Browse college events and see the details before you decide." },
  { icon: Check, title: "Save your spot", body: "Register with your ShowUp account and keep everything together." },
  { icon: QrCode, title: "Show your ticket", body: "Open your QR ticket when you arrive and get checked in." },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <section className="landing-hero border-b border-[#ebebeb]">
        <div className="page-shell flex flex-col items-center px-0 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <span className="landing-kicker inline-flex items-center gap-2 rounded-full border border-[#ebebeb] bg-white/80 px-3 py-2 text-[#555]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0070f3]" /> COLLEGE LIFE, IN ONE PLACE
          </span>
          <h1 className="mt-6 max-w-[820px] text-[clamp(42px,7vw,72px)] font-semibold leading-[.99] tracking-[-.065em] text-ink">
            Good things happen when you show up.
          </h1>
          <p className="mt-6 max-w-[560px] text-base leading-7 text-[#555] sm:text-lg sm:leading-8">
            Find college events, register in a few taps, and keep your ticket ready for the door.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/events" className="btn-primary">Browse events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            {!user && <Link to="/signup" className="btn-secondary">Create an account</Link>}
            {user?.role === "student" && <Link to="/dashboard" className="btn-secondary">View my tickets</Link>}
            {user?.role === "organizer" && <Link to="/organizer/new" className="btn-secondary">Create an event</Link>}
          </div>

          <div className="panel mt-14 w-full max-w-[820px] overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-[#ebebeb] px-5 py-3 sm:px-7">
              <span className="landing-kicker text-[#737373]">THE SHOWUP FLOW</span>
              <span className="text-xs text-[#737373]">From discovery to the door</span>
            </div>
            <div className="ticket-orbit">
              <div aria-hidden="true" className="absolute left-[13%] top-[26%] h-2 w-2 rounded-full bg-[#00b8a9]" />
              <div aria-hidden="true" className="absolute right-[15%] top-[32%] h-2.5 w-2.5 rounded-full bg-[#ec4b91]" />
              <div aria-hidden="true" className="absolute bottom-[18%] left-[25%] h-1.5 w-1.5 rounded-full bg-[#f0a51b]" />
              <div className="ticket-chip">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fafafa] text-ink"><Ticket aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} /></span>
                <span><span className="block text-sm font-medium text-ink">Your event ticket</span><span className="mt-1 block text-xs text-[#737373]">Registered · ready when you are</span></span>
                <QrCode aria-hidden="true" className="ml-2 h-7 w-7 text-ink" strokeWidth={1.5} />
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[#ebebeb] text-center">
              {["Explore", "Register", "Show up"].map((step, index) => <div key={step} className={`px-2 py-3 text-xs sm:text-sm ${index ? "border-l border-[#ebebeb]" : ""}`}><span className="mr-2 font-mono text-[#737373]">0{index + 1}</span><span className="font-medium text-ink">{step}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] py-16 sm:py-24">
        <div className="page-shell">
          <div className="max-w-[560px]">
            <p className="landing-kicker text-[#737373]">A BETTER WAY TO TAKE PART</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.05em] text-ink sm:text-4xl">Make more room for the good stuff.</h2>
            <p className="mt-4 text-base leading-7 text-[#555]">Less time hunting for details. More time finding the events and people you came for.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="panel min-h-48 p-6 sm:p-7">
                <div className="flex items-center justify-between"><Icon aria-hidden="true" className="h-5 w-5 text-ink" strokeWidth={1.7} /><span className="landing-kicker text-[#737373]">0{index + 1}</span></div>
                <h3 className="mt-8 text-lg font-semibold tracking-[-.04em] text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#555]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="flex flex-col gap-7 rounded-2xl border border-[#ebebeb] bg-white p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="max-w-[600px]">
            <p className="landing-kicker text-[#737373]">FOR STUDENTS & ORGANIZERS</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-.05em] text-ink sm:text-3xl">Your next campus moment starts here.</h2>
            <p className="mt-3 text-sm leading-6 text-[#555]">Explore what’s happening or set up an organizer account to share an event with your campus.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/events" className="btn-primary">Explore events <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            {!user && <Link to="/signup" className="btn-secondary">Join ShowUp</Link>}
            {user?.role === "organizer" && <Link to="/organizer/new" className="btn-secondary">Create an event</Link>}
          </div>
        </div>
      </section>
    </div>
  );
};
