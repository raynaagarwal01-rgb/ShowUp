import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEvent, getEvent, listEvents, updateEvent } from "../../lib/db";
import type { EventCategory, EventScope } from "../../types";
import { Field } from "../LoginPage";
import { useAuth } from "../../context/AuthContext";
import { INDIA_STATES } from "../../lib/indiaStates";
import { CitySelect } from "../../components/CitySelect";

const CATEGORIES: EventCategory[] = ["Hackathon", "Workshop", "Competition", "Cultural", "Talk"];

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  title: "",
  tagline: "",
  description: "",
  rules: "",
  category: "Workshop" as EventCategory,
  scope: "both" as EventScope,
  state: "",
  city: "",
  college: "",
  venue: "",
  start_at: "",
  end_at: "",
  registration_deadline: "",
  capacity: 50,
  fee: 0,
  team_min: 1,
  team_max: 1,
};

export const CreateEventPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    state: user?.state ?? "",
    city: user?.city ?? "",
    college: user?.college ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knownColleges, setKnownColleges] = useState<string[]>([]);

  useEffect(() => {
    listEvents().then((events) => {
      setKnownColleges(Array.from(new Set(events.map((e) => e.college))).sort());
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((event) => {
      if (!event) return;
      setForm({
        title: event.title,
        tagline: event.tagline,
        description: event.description,
        rules: event.rules.join("\n"),
        category: event.category,
        scope: event.scope,
        state: event.state,
        city: event.city,
        college: event.college,
        venue: event.venue,
        start_at: toLocalInputValue(event.start_at),
        end_at: toLocalInputValue(event.end_at),
        registration_deadline: toLocalInputValue(event.registration_deadline),
        capacity: event.capacity,
        fee: event.fee,
        team_min: event.team_min,
        team_max: event.team_max,
      });
    });
  }, [id]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.team_max < form.team_min) {
      return setError("Max team size can't be smaller than min team size.");
    }
    if (!form.state) return setError("Select which state this event is in.");
    if (!form.city.trim()) return setError("Enter which city this event is in.");
    if (!form.college.trim()) return setError("Enter which college this event is hosted at.");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        club_id: user.id,
        club_name: user.name,
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        rules: form.rules.split("\n").map((r) => r.trim()).filter(Boolean),
        category: form.category,
        scope: form.scope,
        state: form.state,
        city: form.city,
        college: form.college.trim(),
        venue: form.venue,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        registration_deadline: new Date(form.registration_deadline).toISOString(),
        capacity: Number(form.capacity),
        fee: Number(form.fee),
        team_min: Number(form.team_min),
        team_max: Number(form.team_max),
        banner_hue: Math.floor(Math.random() * 360),
        status: "published" as const,
        created_by: user.id,
      };

      if (isEditing && id) {
        await updateEvent(id, payload);
        navigate(`/organizer/events/${id}`);
      } else {
        const created = await createEvent(payload);
        navigate(`/organizer/events/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{isEditing ? "Edit event" : "Create an event"}</h1>
      <p className="mt-1 text-cream/70">Students will see this the moment you publish it.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>
        <Field label="Tagline (one line)">
          <input
            required
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>
        <Field label="Full description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>
        <Field label="Rules (one per line)">
          <textarea
            rows={3}
            value={form.rules}
            onChange={(e) => set("rules", e.target.value)}
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value as EventCategory)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Who can register">
            <select
              value={form.scope}
              onChange={(e) => set("scope", e.target.value as EventScope)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            >
              <option value="internal">Internal only</option>
              <option value="external">External only</option>
              <option value="both">Both</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="State">
            <select
              required
              value={form.state}
              onChange={(e) => {
                set("state", e.target.value);
                set("city", "");
              }}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            >
              <option value="" disabled>
                Select state
              </option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <CitySelect state={form.state} value={form.city} onChange={(c) => set("city", c)} />
          </Field>
        </div>

        <Field label="College">
          <input
            required
            list="known-colleges"
            value={form.college}
            onChange={(e) => set("college", e.target.value)}
            placeholder="e.g. VIT Vellore"
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
          <datalist id="known-colleges">
            {knownColleges.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Venue">
          <input
            required
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="e.g. Innovation Lab, Block C"
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts">
            <input
              required
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => set("start_at", e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            />
          </Field>
          <Field label="Ends">
            <input
              required
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => set("end_at", e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            />
          </Field>
        </div>

        <Field label="Registration deadline">
          <input
            required
            type="datetime-local"
            value={form.registration_deadline}
            onChange={(e) => set("registration_deadline", e.target.value)}
            className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacity (seats or teams)">
            <input
              required
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => set("capacity", Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            />
          </Field>
          <Field label="Fee in ₹ (0 = free)">
            <input
              required
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => set("fee", Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
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
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            />
          </Field>
          <Field label="Max team size (1 = solo)">
            <input
              required
              type="number"
              min={1}
              value={form.team_max}
              onChange={(e) => set("team_max", Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Publish event"}
        </button>
      </form>
    </div>
  );
};
