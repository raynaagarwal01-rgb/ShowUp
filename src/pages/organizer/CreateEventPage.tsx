import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createEvent, deleteEvent, getEvent, updateEvent } from "../../lib/api";
import type { EventCategory, EventInput } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const CATEGORIES: EventCategory[] = ["Hackathon", "Workshop", "Competition", "Cultural", "Talk"];
const fieldClass = "field w-full";
const emptyForm = {
  title: "", description: "", category: "Workshop" as EventCategory, venue: "",
  event_date: "", registration_deadline: "", capacity: 50, fee: 0,
};

function toLocalInputValue(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const CreateEventPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!!eventId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const event = await getEvent(eventId);
      if (!event) return setLoadError("Event not found.");
      if (event.organizer_id !== userId) return setLoadError("You can only edit events you created.");
      setForm({
        title: event.title, description: event.description, category: event.category,
        venue: event.venue, event_date: toLocalInputValue(event.event_date),
        registration_deadline: toLocalInputValue(event.registration_deadline),
        capacity: event.capacity, fee: event.fee,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load this event.");
    } finally {
      setLoading(false);
    }
  }, [eventId, userId]);

  useEffect(() => { void loadEvent(); }, [loadEvent]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (new Date(form.registration_deadline) > new Date(form.event_date)) {
      setError("The registration deadline must be before the event starts.");
      return;
    }
    setSaving(true);
    try {
      const payload: EventInput = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        registration_deadline: new Date(form.registration_deadline).toISOString(),
        // API types still require these fields; solo registrations are the current UI model.
        team_min: 1,
        team_max: 1,
      };
      await (eventId ? updateEvent(eventId, payload) : createEvent(payload));
      navigate("/organizer", { state: { notice: eventId ? "Changes saved." : "Event created." } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this event. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(eventId);
      navigate("/organizer", { state: { notice: "Event deleted." } });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete this event. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  return <main className="page-shell max-w-3xl space-y-6 py-10 sm:py-14">
    <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#171717]"><ArrowLeft size={16} aria-hidden="true" />Your events</Link>
    <header>
      <p className="eyebrow">Event details</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{eventId ? "Edit event" : "Create an event"}</h1>
      <p className="mt-2 text-sm text-muted">Add the details students need to decide and register.</p>
    </header>

    {loading ? <p role="status" className="panel p-6 text-sm text-muted">Loading event…</p> : loadError ? <div role="alert" className="panel p-5 text-sm text-red-700">{loadError}<div className="mt-3 flex gap-3"><button className="underline" onClick={() => void loadEvent()}>Try again</button><Link className="underline" to="/organizer">Return to your events</Link></div></div> : <>
      <form onSubmit={handleSubmit} className="panel space-y-5 p-5 sm:p-7">
        <label className="block space-y-1.5 text-sm font-medium">Event title<input required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} className={fieldClass} /></label>
        <label className="block space-y-1.5 text-sm font-medium">Description<textarea required rows={5} maxLength={5000} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${fieldClass} min-h-32 resize-y py-2.5`} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">Category<select value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)} className={fieldClass}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="block space-y-1.5 text-sm font-medium">Venue<input required maxLength={200} value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Building, room, or online" className={fieldClass} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">Event date and time<input required type="datetime-local" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={fieldClass} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Registration deadline<input required type="datetime-local" value={form.registration_deadline} onChange={(e) => set("registration_deadline", e.target.value)} className={fieldClass} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">Capacity<input required type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={fieldClass} /></label>
          <label className="block space-y-1.5 text-sm font-medium">Fee (₹)<input required type="number" min={0} value={form.fee} onChange={(e) => set("fee", Number(e.target.value))} className={fieldClass} /><span className="block text-xs font-normal text-muted">Enter 0 for a free event.</span></label>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
          {eventId && <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2 text-red-700" onClick={() => { setDeleteError(null); setConfirmDelete(true); }}><Trash2 size={15} aria-hidden="true" />Delete event</button>}
          <div className="flex justify-end gap-2 sm:ml-auto"><Link to="/organizer" className="btn-secondary">Cancel</Link><button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : eventId ? "Save changes" : "Create event"}</button></div>
        </div>
      </form>
      <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this event?" description={<>“{form.title}” and its registrations will be permanently deleted. This can't be undone.</>} confirmLabel={deleting ? "Deleting…" : "Delete event"} busy={deleting} error={deleteError} onConfirm={handleDelete} />
    </>}
  </main>;
};
