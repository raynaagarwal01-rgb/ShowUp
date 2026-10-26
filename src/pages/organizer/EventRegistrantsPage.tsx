import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, QrCode, Search, Trash2 } from "lucide-react";
import { deleteEvent, getEvent, listParticipants } from "../../lib/api";
import type { EventRecord, Participant } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { ticketCode } from "../../lib/format";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const PAGE_SIZE = 20;

function exportCsv(eventTitle: string, participants: Participant[]) {
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\s=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Ticket", "Name", "Email", "College", "Registration number", "Status", "Check-in"],
    ...participants.map((person) => [ticketCode(person.id), person.name, person.email, person.college, person.reg_no, person.status, person.checked_in_at ? new Date(person.checked_in_at).toLocaleString("en-IN") : "Not checked in"]),
  ];
  const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${eventTitle.replace(/[^\w-]+/g, "_")}_registrations.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const EventRegistrantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const requestedPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedEvent, rows] = await Promise.all([getEvent(eventId), listParticipants(eventId)]);
      if (!loadedEvent || loadedEvent.organizer_id !== userId) {
        setEvent(null);
        setError(loadedEvent ? "You can only view events you created." : "Event not found.");
      } else {
        setEvent(loadedEvent);
        setParticipants(rows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load registrations.");
    } finally {
      setLoading(false);
    }
  }, [eventId, userId]);

  useEffect(() => { void load(); /* shortcut: participants load once per event; add API paging if event sizes outgrow a browser-sized list. */ }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return term ? participants.filter((person) => [person.name, person.email, person.college, person.reg_no].some((value) => value?.toLocaleLowerCase().includes(term))) : participants;
  }, [participants, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const checkedIn = participants.filter((person) => person.checked_in_at).length;
  const confirmed = participants.filter((person) => person.status === "confirmed").length;

  const changeQuery = (value: string) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (value) next.set("q", value); else next.delete("q");
    next.delete("page");
    return next;
  }, { replace: true });
  const changePage = (value: number) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (value <= 1) next.delete("page"); else next.set("page", String(value));
    return next;
  });

  const handleDelete = async () => {
    if (!event || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(event.id);
      navigate("/organizer", { state: { notice: "Event deleted." } });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete this event. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <main className="page-shell py-12"><p role="status" className="text-center text-sm text-muted">Loading registrations…</p></main>;
  if (!event) return <main className="page-shell py-12"><div role="alert" className="panel p-5 text-sm text-red-700">{error ?? "Event not found."}<div className="mt-4 flex gap-3"><button className="btn-secondary" onClick={() => void load()}>Try again</button><Link className="btn-secondary" to="/organizer">Your events</Link></div></div></main>;

  return <main className="page-shell space-y-7 py-10 sm:py-14">
    <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#171717]"><ArrowLeft size={16} aria-hidden="true" />Your events</Link>
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div><p className="eyebrow">{event.category} · {event.venue}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{event.title}</h1><p className="mt-2 text-sm text-muted">Registrations and attendance</p></div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/organizer/events/${event.id}/checkin`} className="btn-secondary inline-flex items-center gap-2"><QrCode size={15} aria-hidden="true" />Check-in</Link>
        <Link to={`/organizer/events/${event.id}/edit`} className="btn-secondary">Edit event</Link>
        <button className="btn-secondary inline-flex items-center gap-2" onClick={() => exportCsv(event.title, filtered)}><Download size={15} aria-hidden="true" />Export CSV</button>
        <button className="btn-secondary inline-flex items-center gap-2 text-red-700" onClick={() => { setDeleteError(null); setConfirmDelete(true); }}><Trash2 size={15} aria-hidden="true" />Delete</button>
      </div>
    </header>

    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <section aria-label="Registration summary" className="grid gap-3 sm:grid-cols-3">
      <div className="panel p-4"><p className="text-sm text-muted">Registrations</p><p className="mt-1 text-2xl font-semibold tabular-nums">{participants.length}<span className="text-base font-normal text-muted"> / {event.capacity}</span></p></div>
      <div className="panel p-4"><p className="text-sm text-muted">Confirmed</p><p className="mt-1 text-2xl font-semibold tabular-nums">{confirmed}</p></div>
      <div className="panel p-4"><p className="text-sm text-muted">Checked in</p><p className="mt-1 text-2xl font-semibold tabular-nums">{checkedIn}</p></div>
    </section>

    <section aria-label="Registration list" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">People registered <span className="text-sm font-normal text-muted">({filtered.length})</span></h2>
        <label className="relative block sm:w-80"><span className="sr-only">Search registrations</span><Search className="absolute left-3 top-3 text-muted" size={16} aria-hidden="true" /><input value={query} onChange={(e) => changeQuery(e.target.value)} placeholder="Search name, email, college…" className="field w-full pl-9" /></label>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border bg-[#fafafa] text-xs text-muted"><tr>{["Name", "Email", "College / reg no.", "Status", "Check-in"].map((title) => <th key={title} scope="col" className="px-4 py-3 font-medium">{title}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {visible.length ? visible.map((person) => <tr key={person.id}>
              <td className="px-4 py-3 font-medium">{person.name}</td><td className="px-4 py-3 text-muted">{person.email}</td>
              <td className="px-4 py-3"><span className="block">{person.college || "—"}</span>{person.reg_no && <span className="text-xs text-muted">{person.reg_no}</span>}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-[#f5f5f5] px-2 py-1 text-xs capitalize">{person.status}</span></td>
              <td className="px-4 py-3">{person.checked_in_at ? <span className="text-sm">Checked in</span> : <span className="text-muted">Not yet</span>}</td>
            </tr>) : <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">{query ? "No registrations match your search." : "No registrations yet."}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2"><button className="btn-secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button><button className="btn-secondary" disabled={page >= pages} onClick={() => changePage(page + 1)}>Next</button></div>
      </div>
    </section>
    <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this event?" description={<>“{event.title}” and its registrations will be permanently deleted. This can't be undone.</>} confirmLabel={deleting ? "Deleting…" : "Delete event"} busy={deleting} error={deleteError} onConfirm={handleDelete} />
  </main>;
};
