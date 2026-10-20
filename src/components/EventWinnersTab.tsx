import React, { useEffect, useState } from "react";
import { Award, Medal, PlusCircle, Sparkles, Trophy } from "lucide-react";
import { addWinner, listWinners } from "../lib/api";
import type { EventWinner } from "../types";

interface EventWinnersTabProps {
  eventId: number;
  /** True when the signed-in user created this event — only they can add winners. */
  isOrganizer?: boolean;
}

const PODIUM = [
  { position: 1, label: "1st Place", icon: Trophy, card: "border-2 border-amber-400/60 bg-gradient-to-b from-amber-950/20 via-surface to-surface shadow-xl shadow-amber-500/10", accent: "text-amber-400", order: "order-1 md:order-2" },
  { position: 2, label: "2nd Place", icon: Medal, card: "border border-slate-400/40 bg-surface shadow-md", accent: "text-slate-300", order: "order-2 md:order-1" },
  { position: 3, label: "3rd Place", icon: Award, card: "border border-amber-700/40 bg-surface shadow-md", accent: "text-amber-500", order: "order-3" },
];

export const EventWinnersTab: React.FC<EventWinnersTabProps> = ({ eventId, isOrganizer = false }) => {
  const [winners, setWinners] = useState<EventWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [position, setPosition] = useState(1);
  const [name, setName] = useState("");
  const [prize, setPrize] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listWinners(eventId)
      .then(setWinners)
      .catch(() => setError("Couldn't load winners."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await addWinner(eventId, { position, winner_name: name.trim(), prize: prize.trim() });
      setWinners((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setShowAddForm(false);
      setName("");
      setPrize("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add winner");
    } finally {
      setSubmitting(false);
    }
  };

  const otherWinners = winners.filter((w) => w.position > 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-semibold text-cream">Winners &amp; Results</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Results as entered by the event organizer.</p>
        </div>

        {isOrganizer && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {showAddForm ? "Close form" : "Add winner"}
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">{error}</div>}

      {showAddForm && (
        <form
          onSubmit={handlePublish}
          className="rounded-2xl border border-amber-500/40 bg-surface-2 p-5 space-y-4 shadow-xl shadow-amber-500/5"
        >
          <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" /> Add a winner
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              >
                <option value={1}>1st place</option>
                <option value={2}>2nd place</option>
                <option value={3}>3rd place</option>
                <option value={4}>Special mention</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">Team or participant name</label>
              <input
                type="text"
                value={name}
                maxLength={150}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Team ByteForge"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">Prize (optional)</label>
              <input
                type="text"
                value={prize}
                maxLength={100}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. Rs. 10,000"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-border px-3.5 py-1.5 text-xs text-muted hover:text-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-ink disabled:opacity-50 hover:bg-amber-300"
            >
              {submitting ? "Saving..." : "Save winner"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-muted">Loading results...</div>
      ) : winners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
          <Trophy className="mx-auto h-10 w-10 text-muted/40 mb-2" />
          <p className="font-display text-sm font-semibold text-cream">Results not announced yet</p>
          <p className="text-xs text-muted max-w-sm mx-auto">Winners will be listed here once the organizer adds them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {PODIUM.map((slot) =>
              winners
                .filter((w) => w.position === slot.position)
                .map((w) => (
                  <div key={w.id} className={`${slot.order} rounded-2xl p-5 space-y-3.5 ${slot.card}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${slot.accent}`}>
                        <slot.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${slot.accent}`}>{slot.label}</span>
                        <h3 className="font-display text-base font-bold text-cream">{w.winner_name}</h3>
                      </div>
                    </div>
                    {w.prize && (
                      <div className={`border-t border-border/80 pt-3 text-sm font-bold ${slot.accent}`}>🎁 {w.prize}</div>
                    )}
                  </div>
                )),
            )}
          </div>

          {otherWinners.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-coral" /> Special mentions
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherWinners.map((w) => (
                  <div key={w.id} className="rounded-xl border border-border bg-surface p-4 space-y-1.5 text-xs">
                    <div className="font-semibold text-cream text-sm">{w.winner_name}</div>
                    {w.prize && <div className="text-amber-400 font-semibold">{w.prize}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
