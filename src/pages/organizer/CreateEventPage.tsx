import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { createEvent, deleteEvent, getEvent, updateEvent } from "../../lib/api";
import type { EventCategory, EventInput } from "../../types";
import { Field } from "../LoginPage";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES: EventCategory[] = ["Hackathon", "Workshop", "Competition", "Cultural", "Talk"];

const inputClass =
  "w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none";

/** ISO string -> value for <input type="datetime-local"> in local time. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  title: "",
  description: "",
  category: "Workshop" as EventCategory,
  venue: "",
  event_date: "",
  registration_deadline: "",
  capacity: 50,
  fee: 0,
  team_min: 1,
  team_max: 1,
};

export const CreateEventPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then((event) => {
      if (!event) return setError("Event not found.");
      if (event.organizer_id !== user?.id) return setError("You can only edit events you created.");
      setForm({
        title: event.title,
        description: event.description,
        category: event.category,
        venue: event.venue,
        event_date: toLocalInputValue(event.event_date),
        registration_deadline: toLocalInputValue(event.registration_deadline),
        capacity: event.capacity,
        fee: event.fee,
        team_min: event.team_min,
        team_max: event.team_max,
      });
    });
  }, [eventId, user?.id]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleDelete = async () => {
    if (!eventId) return;
    const confirmed = window.confirm(
      `Permanently delete "${form.title || "this event"}"?\n\nAll registrations, teams, announcements, questions and winners for it are deleted too.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteEvent(eventId);
      navigate("/organizer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.team_max < form.team_min) return setError("Max team size can't be smaller than min team size.");
    if (new Date(form.registration_deadline) > new Date(form.event_date)) {
      return setError("The registration deadline must be before the event starts.");
    }
    setSaving(true);
    setError(null);
    try {
      const payload: EventInput = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        registration_deadline: new Date(form.registration_deadline).toISOString(),
      };
      const saved = eventId ? await updateEvent(eventId, payload) : await createEvent(payload);
      navigate(`/organizer/events/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{eventId ? "Edit event" : "Create an event"}</h1>
      <p className="mt-1 text-cream/70">
        Students will see this the moment you publish it. Your organizer name
        {user?.college ? ` and college (${user.college})` : ""} are shown as the host.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <Field label="Title">
          <input required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Description (include any rules here)">
          <textarea
            required
            rows={5}
            maxLength={5000}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Venue">
            <input
              required
              maxLength={200}
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="e.g. Innovation Lab, Block C"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Event date & time">
            <input
              required
              type="datetime-local"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Registration deadline">
            <input
              required
              type="datetime-local"
              value={form.registration_deadline}
              onChange={(e) => set("registration_deadline", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacity (number of participants)">
            <input
              required
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Fee in ₹ (0 = free, shown only)">
            <input
              required
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => set("fee", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min team size">
            <input
              required
              type="number"
              min={1}
              value={form.team_min}
              onChange={(e) => set("team_min", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Max team size (1 = solo)">
            <input
              required
              type="number"
              min={1}
              value={form.team_max}
              onChange={(e) => set("team_max", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {saving ? "Saving..." : eventId ? "Save changes" : "Publish event"}
        </button>
      </form>

      {eventId && (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <AlertTriangle className="h-4 w-4" /> Danger Zone: Delete Event
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Deleting this event permanently removes its registrations, teams, announcements, questions and winners.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting event..." : "Delete this event"}
          </button>
        </div>
      )}
    </div>
  );
};
