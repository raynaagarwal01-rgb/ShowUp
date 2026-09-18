import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, MessageCircle, Pencil, Send, Trash2, UserPlus, Users2 } from "lucide-react";
import { listTeammateListings, upsertTeammateListing, deleteTeammateListing } from "../lib/db";
import type { TeammateListing } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  eventId: string;
}

export const TeammatesTab: React.FC<Props> = ({ eventId }) => {
  const { user } = useAuth();
  const [listings, setListings] = useState<TeammateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [lookingFor, setLookingFor] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myListing = listings.find((l) => l.user_id === user?.id);
  const otherListings = listings.filter((l) => l.user_id !== user?.id);

  const fetchListings = async () => {
    try {
      const data = await listTeammateListings(eventId);
      setListings(data);
    } catch (e) {
      console.error("Failed to fetch teammate listings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const openForm = (existing?: TeammateListing) => {
    setLookingFor(existing?.looking_for || "");
    setMessage(existing?.message || "");
    setContact(existing?.contact || user?.email || "");
    setError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !lookingFor.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await upsertTeammateListing(
        eventId,
        user.id,
        user.name,
        user.college || "",
        lookingFor.trim(),
        message.trim(),
        contact.trim(),
      );
      setListings((prev) => {
        const withoutMine = prev.filter((l) => l.user_id !== user.id);
        return [updated, ...withoutMine];
      });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !myListing) return;
    await deleteTeammateListing(myListing.id, user.id);
    setListings((prev) => prev.filter((l) => l.id !== myListing.id));
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  const ListingCard: React.FC<{ listing: TeammateListing; mine?: boolean }> = ({ listing, mine }) => (
    <div
      className={`rounded-2xl border p-4.5 space-y-3 ${
        mine ? "border-coral/40 bg-coral/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/u/${listing.user_id}`}
              className="text-sm font-semibold text-cream hover:text-coral transition-colors"
            >
              {listing.user_name}
            </Link>
            {mine && (
              <span className="rounded-full bg-coral/20 border border-coral/40 px-2 py-0.5 text-[10px] font-bold text-coral">
                You
              </span>
            )}
            <span className="text-[11px] text-muted">· {formatDate(listing.created_at)}</span>
          </div>
          {listing.user_college && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <GraduationCap className="h-3.5 w-3.5" /> {listing.user_college}
            </p>
          )}
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 border border-border px-2.5 py-1 text-xs font-semibold text-coral-light">
        <Users2 className="h-3.5 w-3.5" /> Looking for: {listing.looking_for}
      </div>

      {listing.message && <p className="text-sm text-cream/80 leading-relaxed">{listing.message}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        {listing.contact ? (
          <span className="flex items-center gap-1.5 text-xs text-cream/80">
            <MessageCircle className="h-3.5 w-3.5 text-coral" /> {listing.contact}
          </span>
        ) : (
          <Link to={`/u/${listing.user_id}`} className="text-xs font-medium text-coral">
            View portfolio for contact links →
          </Link>
        )}

        {mine && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openForm(myListing)}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-cream hover:border-coral/40 transition-colors"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              type="button"
              onClick={handleWithdraw}
              className="flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Withdraw
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-coral" />
          <h2 className="font-display text-xl font-semibold text-cream">Find Teammates</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Solo and short on teammates? Post here so other solo participants can find and contact you.
        </p>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted">
          <Link to="/login" className="font-semibold text-coral">
            Sign in
          </Link>{" "}
          to post that you're looking for a team.
        </div>
      ) : myListing && !formOpen ? (
        <ListingCard listing={myListing} mine />
      ) : formOpen ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-coral/30 bg-surface p-4.5 space-y-3.5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-cream">
            {myListing ? "Edit your listing" : "Post that you're looking for a team"}
          </h3>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] text-muted block mb-1">
              What role or skills are you looking for?
            </label>
            <input
              type="text"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. A designer and a backend dev to join me"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-muted block mb-1">About you (optional)</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What you're building, your skills, availability..."
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted block mb-1">
              How should teammates reach you? (optional — shown publicly)
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. WhatsApp 98xxxxxx10, or your email"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted">
              Leave blank to only share your portfolio link instead.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !lookingFor.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50 hover:opacity-95 transition-opacity"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => openForm()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-coral/40 bg-coral/5 py-4 text-sm font-semibold text-coral hover:bg-coral/10 transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Post that you're looking for a team
        </button>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-muted">Loading teammate listings...</div>
      ) : otherListings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Users2 className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium text-cream/80">No one else is looking for a team yet</p>
          <p className="mt-1 text-xs text-muted">Be the first to post above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {otherListings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
};
