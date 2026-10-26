import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Download, MapPin, Ticket as TicketIcon } from "lucide-react";
import { cancelRegistration, listMyRegistrations } from "../lib/api";
import type { MyRegistration } from "../types";
import { formatEventDate, ticketCode } from "../lib/format";
import { StatusPill, registrationTone } from "../components/StatusPill";
import { QRTicket } from "../components/QRTicket";
import { useAuth } from "../context/AuthContext";
import { downloadTicketImage } from "../lib/ticketExport";
import { ConfirmDialog } from "../components/ConfirmDialog";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [regs, setRegs] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyRegistration | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    try {
      const items = await listMyRegistrations();
      if (mounted.current) setRegs(items);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Couldn't load your registrations.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    listMyRegistrations().then((items) => { if (mounted.current) setRegs(items); })
      .catch((e) => { if (mounted.current) setError(e instanceof Error ? e.message : "Couldn't load your registrations."); })
      .finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, []);

  const handleCancel = async () => {
    if (!cancelTarget || cancelBusy) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await cancelRegistration(cancelTarget.id);
      if (mounted.current) {
        setRegs((current) => current.filter((registration) => registration.id !== cancelTarget.id));
        setNotice(`Registration for ${cancelTarget.event.title} cancelled.`);
        setCancelTarget(null);
      }
    } catch (e) {
      if (mounted.current) setCancelError(e instanceof Error ? e.message : "Couldn't cancel that registration.");
    } finally {
      if (mounted.current) setCancelBusy(false);
    }
  };

  const confirmedCount = regs.filter((r) => r.status === "confirmed").length;
  const checkedInCount = regs.filter((r) => Boolean(r.checked_in_at)).length;

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">My events</h1>
          <p className="mt-2 text-sm text-[#737373]">Your registrations and check-in tickets, all in one place.</p>
        </div>
        <Link to="/events" className="btn-primary min-h-11">Browse events</Link>
      </div>

      <div className="mt-6 grid max-w-md grid-cols-2 gap-3" aria-label="Registration summary">
        <div className="rounded-lg border border-border bg-white p-4"><p className="text-xs text-[#737373]">Confirmed</p><p className="mt-1 text-2xl font-semibold">{loading ? "—" : confirmedCount}</p></div>
        <div className="rounded-lg border border-border bg-white p-4"><p className="text-xs text-[#737373]">Checked in</p><p className="mt-1 text-2xl font-semibold">{loading ? "—" : checkedInCount}</p></div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">{notice}</p>
      {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setError(null); void load(); }} disabled={loading} className="mt-2 underline">{loading ? "Retrying…" : "Try again"}</button></div>}

      <div className="mt-8 space-y-4">
        {loading ? <p className="text-sm text-[#737373]" role="status">Loading your registrations…</p> : !error && regs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#a1a1a1] py-16 text-center">
            <TicketIcon aria-hidden="true" className="mx-auto h-8 w-8 text-[#737373]" />
            <p className="mt-3 font-medium">No registrations yet.</p>
            <Link to="/events" className="mt-2 inline-block text-sm font-medium text-[#0761d1]">Browse events</Link>
          </div>
        ) : regs.map((r) => (
          <article key={r.id} className="rounded-xl border border-border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/events/${r.event.id}`} className="font-display text-lg font-semibold hover:underline">{r.event.title}</Link>
                  <StatusPill label={r.status} tone={registrationTone(r.status)} />
                  {r.checked_in_at && <StatusPill label="Checked in" tone="success" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4d4d4d]">
                  <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#737373]" />{formatEventDate(r.event.event_date)}</span>
                  <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" className="h-4 w-4 text-[#737373]" />{r.event.venue}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status === "confirmed" && <button type="button" onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)} className="btn-secondary min-h-10 px-3 text-sm">{openTicket === r.id ? "Hide ticket" : "Show ticket"}</button>}
                {r.status === "confirmed" && <button type="button" onClick={() => { setCancelError(null); setCancelTarget(r); }} className="btn-secondary min-h-10 px-3 text-sm text-red-700">Cancel registration</button>}
              </div>
            </div>
            {r.status === "confirmed" && openTicket === r.id && <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-border bg-[#fafafa] p-5 text-center">
              <div role="img" aria-label={`Check-in QR ticket for ${r.event.title}, ${ticketCode(r.id)}`}><QRTicket value={ticketCode(r.id)} /></div>
              <p className="text-sm text-[#4d4d4d]">Registration code <span className="font-mono font-medium">{ticketCode(r.id)}</span></p>
              <button type="button" onClick={() => downloadTicketImage({ event: r.event, registrationId: r.id, attendeeName: user?.name || "Participant", attendeeEmail: user?.email })} className="btn-secondary min-h-10 px-3 text-sm"><Download aria-hidden="true" className="h-4 w-4" />Download ticket</button>
            </div>}
          </article>
        ))}
      </div>

      <ConfirmDialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !cancelBusy) { setCancelTarget(null); setCancelError(null); } }} title="Cancel this registration?" description={<>You will cancel your registration for “{cancelTarget?.event.title}”.</>} confirmLabel={cancelBusy ? "Cancelling…" : "Cancel registration"} busy={cancelBusy} error={cancelError} onConfirm={handleCancel} />
    </div>
  );
};
