import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CalendarDays, Download, MapPin, Navigation, Ticket as TicketIcon, Users, X } from "lucide-react";
import { cancelRegistration, listMyRegistrations } from "../lib/api";
import type { EventRecord, MyRegistration } from "../types";
import { formatEventDate, ticketCode } from "../lib/format";
import { StatusPill, registrationTone } from "../components/StatusPill";
import { QRTicket } from "../components/QRTicket";
import { useAuth } from "../context/AuthContext";
import { downloadTicketImage } from "../lib/ticketExport";
import { AddToCalendarButton } from "../components/AddToCalendarButton";
import { CertificateModal } from "../components/CertificateModal";
import { TeamHubModal } from "../components/TeamHubModal";
import { EventLocationModal } from "../components/EventLocationModal";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [regs, setRegs] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  const [selectedCertRegistration, setSelectedCertRegistration] = useState<MyRegistration | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMapEvent, setSelectedMapEvent] = useState<EventRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRegs(await listMyRegistrations());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async (r: MyRegistration) => {
    const teamNote = r.team ? ` You will also leave team "${r.team.name}".` : "";
    if (!window.confirm(`Cancel your registration for "${r.event.title}"?${teamNote}`)) return;
    try {
      await cancelRegistration(r.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't cancel that registration.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">My events</h1>
      <p className="mt-1 text-cream/70">Every event you're registered for, with your QR ticket.</p>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : user?.role === "organizer" ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-cream/80">Organizer accounts don't register for events.</p>
            <Link to="/organizer" className="mt-2 inline-block text-sm font-medium text-coral">
              Go to Organizer Studio
            </Link>
          </div>
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
                  <div className="flex flex-wrap items-center gap-2">
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
                      <CalendarDays className="h-3.5 w-3.5" /> {formatEventDate(r.event.event_date)}
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <MapPin className="h-3.5 w-3.5 text-coral" /> {r.event.venue}
                      <button
                        type="button"
                        onClick={() => setSelectedMapEvent(r.event)}
                        className="inline-flex items-center gap-1 rounded bg-coral/15 hover:bg-coral/25 border border-coral/35 px-1.5 py-0.5 text-[10px] font-semibold text-coral transition-colors"
                        title="Open map & check distance from your place"
                      >
                        <Navigation className="h-2.5 w-2.5" /> Map &amp; Distance
                      </button>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AddToCalendarButton event={r.event} />
                  <button
                    type="button"
                    onClick={() => setSelectedCertRegistration(r)}
                    className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:border-amber-400 transition-colors"
                    title="Participation certificate (demo)"
                  >
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Certificate
                  </button>
                  {r.team_id && (
                    <button
                      type="button"
                      onClick={() => setSelectedTeamId(r.team_id)}
                      className="flex items-center gap-1 rounded-lg border border-coral/40 bg-coral/10 px-2.5 py-1.5 text-xs font-bold text-coral hover:bg-coral/20 transition-colors"
                      title="See your team and its join code"
                    >
                      <Users className="h-3.5 w-3.5" />
                      My Team
                    </button>
                  )}
                  <button
                    onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-cream/80 hover:border-coral/50"
                  >
                    {openTicket === r.id ? "Hide ticket" : "Show ticket"}
                  </button>
                  <button
                    onClick={() => handleCancel(r)}
                    className="rounded-lg p-1.5 text-muted hover:text-danger"
                    title="Cancel registration"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {openTicket === r.id && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-ink p-5 text-center">
                  <QRTicket value={ticketCode(r.id)} />
                  <p className="text-xs text-muted">
                    Show this QR ticket at check-in · <span className="font-mono">{ticketCode(r.id)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      downloadTicketImage({
                        event: r.event,
                        registrationId: r.id,
                        attendeeName: user?.name || "Participant",
                        attendeeEmail: user?.email,
                        teamName: r.team?.name,
                      })
                    }
                    className="mt-1 flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-ink shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Pass (PNG)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedCertRegistration && (
        <CertificateModal
          isOpen={true}
          onClose={() => setSelectedCertRegistration(null)}
          event={selectedCertRegistration.event}
          attendeeName={user?.name || "Participant"}
          attendeeCollege={user?.college || undefined}
          registrationId={selectedCertRegistration.id}
          checkedIn={!!selectedCertRegistration.checked_in_at}
        />
      )}

      {selectedTeamId && (
        <TeamHubModal isOpen={true} onClose={() => setSelectedTeamId(null)} teamId={selectedTeamId} currentUserId={user?.id} />
      )}

      {selectedMapEvent && (
        <EventLocationModal isOpen={true} onClose={() => setSelectedMapEvent(null)} event={selectedMapEvent} />
      )}
    </div>
  );
};
