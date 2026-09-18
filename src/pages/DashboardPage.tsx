import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Download, MapPin, Ticket as TicketIcon, X } from "lucide-react";
import { cancelRegistration, listMyRegistrations } from "../lib/db";
import type { RegistrationWithEvent } from "../types";
import { formatDateRange } from "../lib/format";
import { StatusPill, registrationTone } from "../components/StatusPill";
import { QRTicket } from "../components/QRTicket";
import { useAuth } from "../context/AuthContext";
import { downloadTicketImage } from "../lib/ticketExport";
import { AddToCalendarButton } from "../components/AddToCalendarButton";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [regs, setRegs] = useState<RegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await listMyRegistrations(user.id);
    setRegs(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (id: string) => {
    await cancelRegistration(id);
    await load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">My events</h1>
      <p className="mt-1 text-cream/70">Every event you're registered for, with your QR ticket.</p>

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : regs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <TicketIcon className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-cream/80">No registrations yet.</p>
            <Link to="/events" className="mt-2 inline-block text-sm font-medium text-coral">
              Browse events
            </Link>
          </div>
        ) : (
          regs.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/events/${r.event.id}`} className="font-display font-semibold hover:text-coral-light">
                      {r.event.title}
                    </Link>
                    <StatusPill label={r.status} tone={registrationTone(r.status)} />
                    {r.checked_in_at && <StatusPill label="Checked in" tone="success" />}
                  </div>
                  {r.team && (
                    <p className="mt-1 text-xs text-muted">
                      Team "{r.team.name}" · join code <span className="font-mono text-coral-light">{r.team.join_code}</span>
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(r.event.start_at, r.event.end_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {r.event.venue}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AddToCalendarButton event={r.event} />
                  {r.status !== "cancelled" && (
                    <button
                      onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cream/80 hover:border-coral/50"
                    >
                      {openTicket === r.id ? "Hide ticket" : "Show ticket"}
                    </button>
                  )}
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="rounded-lg p-1.5 text-muted hover:text-danger"
                    title="Cancel registration"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {openTicket === r.id && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-ink p-5 text-center">
                  <QRTicket value={r.id} />
                  <p className="text-xs text-muted">Show this QR ticket at check-in</p>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTicketImage({
                        event: r.event,
                        registrationId: r.id,
                        attendeeName: user?.name || "Participant",
                        attendeeEmail: user?.email,
                        attendeePhone: user?.phone,
                        teamName: r.team?.name,
                      })
                    }
                    className="mt-1 flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-ink shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Offline Pass (PNG)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
