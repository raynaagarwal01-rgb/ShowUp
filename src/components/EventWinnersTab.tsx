import React, { useEffect, useState } from "react";
import {
  Award,
  ExternalLink,
  Medal,
  PlusCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { listEventWinners, publishEventWinner } from "../lib/db";
import type { EventWinner } from "../types";
import { useAuth } from "../context/AuthContext";

interface EventWinnersTabProps {
  eventId: string;
  isOrganizer?: boolean;
}

export const EventWinnersTab: React.FC<EventWinnersTabProps> = ({
  eventId,
  isOrganizer = false,
}) => {
  const { user } = useAuth();
  const [winners, setWinners] = useState<EventWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [position, setPosition] = useState<number>(1);
  const [winnerTitle, setWinnerTitle] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("Vellore Institute of Technology, Vellore");
  const [prize, setPrize] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canPublish = isOrganizer || user?.role === "organizer" || user?.role === "admin";

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const data = await listEventWinners(eventId);
      setWinners(data);
    } catch (err) {
      console.error("Failed to load winners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, [eventId]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !winnerTitle.trim()) return;

    setSubmitting(true);
    try {
      const created = await publishEventWinner({
        event_id: eventId,
        position,
        winner_title: winnerTitle.trim(),
        team_or_participant_name: name.trim(),
        college: college.trim(),
        prize_amount: prize.trim(),
        project_title: projectTitle.trim(),
        project_link: projectLink.trim(),
        announced_by: user?.name ? `Organizer: ${user.name}` : "Executive Jury",
      });
      setWinners((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setShowAddForm(false);
      setName("");
      setWinnerTitle("");
      setPrize("");
      setProjectTitle("");
      setProjectLink("");
    } catch (err) {
      console.error("Failed to publish winner:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const firstPlace = winners.find((w) => w.position === 1);
  const secondPlace = winners.find((w) => w.position === 2);
  const thirdPlace = winners.find((w) => w.position === 3);
  const otherWinners = winners.filter((w) => w.position > 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-semibold text-cream">
              Official Winners &amp; Results Board
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Authenticated podium rankings, grand prize awards, and showcased projects.
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {showAddForm ? "Close Form" : "Announce Winner"}
          </button>
        )}
      </div>

      {/* Organizer Publish Form */}
      {showAddForm && (
        <form
          onSubmit={handlePublish}
          className="rounded-2xl border border-amber-500/40 bg-surface-2 p-5 space-y-4 shadow-xl shadow-amber-500/5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" /> Announce Official Podium Winner
            </h3>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Jury / Organizer Mode
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                Podium Rank
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              >
                <option value={1}>1st Place (Gold Champion)</option>
                <option value={2}>2nd Place (1st Runner Up)</option>
                <option value={3}>3rd Place (2nd Runner Up)</option>
                <option value={4}>Special Recognition / Category Award</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                Award Title
              </label>
              <input
                type="text"
                value={winnerTitle}
                onChange={(e) => setWinnerTitle(e.target.value)}
                placeholder="e.g. 1st Place · Grand Champion / Best AI Model"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                Team or Participant Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Team CyberVellore (Rayna Agarwal & Team)"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Vellore Institute of Technology, Vellore"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                Prize Won
              </label>
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="e.g. ₹25,000 + Gold Trophy + Goodies"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cream/80 mb-1">
                Project Title (Optional)
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. ShowUp: Campus Events Operating Platform"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-cream/80 mb-1">
              Project Demo / GitHub Repository URL (Optional)
            </label>
            <input
              type="url"
              value={projectLink}
              onChange={(e) => setProjectLink(e.target.value)}
              placeholder="https://github.com/raynaagarwal01-rgb/showup"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-cream focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              {submitting ? "Publishing..." : "Publish to Leaderboard"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-muted">Loading official results...</div>
      ) : winners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
          <Trophy className="mx-auto h-10 w-10 text-muted/40 mb-2" />
          <p className="font-display text-sm font-semibold text-cream">Results Pending Evaluation</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            The jury evaluation and project review are in progress. Winners will be officially announced here once concluded!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* 1st Place (Center / Main) */}
            {firstPlace && (
              <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-950/20 via-surface to-surface p-5 space-y-3.5 shadow-xl shadow-amber-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-ink text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Champion
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      1st Place
                    </span>
                    <h3 className="font-display text-base font-bold text-cream">
                      {firstPlace.team_or_participant_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1 text-xs border-t border-border/80 pt-3">
                  <div className="text-muted">{firstPlace.college}</div>
                  {firstPlace.prize_amount && (
                    <div className="text-amber-300 font-bold text-sm">
                      🎁 {firstPlace.prize_amount}
                    </div>
                  )}
                </div>

                {firstPlace.project_title && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 text-xs">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                      Winning Submission
                    </span>
                    <span className="text-cream/90 font-medium">{firstPlace.project_title}</span>
                    {firstPlace.project_link && (
                      <a
                        href={firstPlace.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-[11px] text-coral hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View Project Repository
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2nd Place */}
            {secondPlace && (
              <div className="order-2 md:order-1 rounded-2xl border border-slate-400/40 bg-surface p-5 space-y-3.5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-400/15 border border-slate-400/30 flex items-center justify-center text-slate-300">
                    <Medal className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      2nd Place
                    </span>
                    <h3 className="font-display text-sm font-bold text-cream">
                      {secondPlace.team_or_participant_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1 text-xs border-t border-border/80 pt-3">
                  <div className="text-muted">{secondPlace.college}</div>
                  {secondPlace.prize_amount && (
                    <div className="text-slate-200 font-bold">
                      🎁 {secondPlace.prize_amount}
                    </div>
                  )}
                </div>

                {secondPlace.project_title && (
                  <div className="rounded-xl border border-border bg-surface-2 p-2.5 text-xs">
                    <span className="text-cream/90 font-medium">{secondPlace.project_title}</span>
                    {secondPlace.project_link && (
                      <a
                        href={secondPlace.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-[11px] text-coral hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Project Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="order-3 md:order-3 rounded-2xl border border-amber-700/40 bg-surface p-5 space-y-3.5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-700/15 border border-amber-700/30 flex items-center justify-center text-amber-500">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                      3rd Place
                    </span>
                    <h3 className="font-display text-sm font-bold text-cream">
                      {thirdPlace.team_or_participant_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1 text-xs border-t border-border/80 pt-3">
                  <div className="text-muted">{thirdPlace.college}</div>
                  {thirdPlace.prize_amount && (
                    <div className="text-amber-500/90 font-bold">
                      🎁 {thirdPlace.prize_amount}
                    </div>
                  )}
                </div>

                {thirdPlace.project_title && (
                  <div className="rounded-xl border border-border bg-surface-2 p-2.5 text-xs">
                    <span className="text-cream/90 font-medium">{thirdPlace.project_title}</span>
                    {thirdPlace.project_link && (
                      <a
                        href={thirdPlace.project_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-[11px] text-coral hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Project Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Other Categories / Special Mentions */}
          {otherWinners.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-coral" /> Category Awards &amp; Special Mentions
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherWinners.map((winner) => (
                  <div
                    key={winner.id}
                    className="rounded-xl border border-border bg-surface p-4 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-coral text-[11px] uppercase tracking-wide">
                        {winner.winner_title}
                      </span>
                      {winner.prize_amount && (
                        <span className="text-amber-400 font-semibold">{winner.prize_amount}</span>
                      )}
                    </div>
                    <div className="font-semibold text-cream text-sm">
                      {winner.team_or_participant_name}
                    </div>
                    <div className="text-muted text-[11px]">{winner.college}</div>
                    {winner.project_title && (
                      <div className="text-cream/80 italic pt-1">{winner.project_title}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/80 bg-surface-2/60 p-3 text-[11px] text-muted flex items-center justify-between">
            <span>Verified Results Authenticated by Festival Jury &amp; ShowUp Board.</span>
            <span className="font-mono text-cream/70">IMMUTABLE RECORD</span>
          </div>
        </div>
      )}
    </div>
  );
};
