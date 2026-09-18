import React, { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, MessageSquare, Reply, Send, ShieldCheck, User } from "lucide-react";
import { listEventQuestions, askEventQuestion, answerEventQuestion } from "../lib/db";
import type { EventQuestion } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  eventId: string;
  isOrganizer?: boolean;
}

export const EventQnATab: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all");

  // New question form
  const [newQuestion, setNewQuestion] = useState("");
  const [guestName, setGuestName] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  // Answering state: maps questionId to draft answer string
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const canAnswer = isOrganizer || user?.role === "organizer";

  const fetchQuestions = async () => {
    try {
      const data = await listEventQuestions(eventId);
      setQuestions(data);
    } catch (e) {
      console.error("Failed to fetch questions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [eventId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const authorName = user?.name || guestName.trim() || "VIT Student";
    setSubmittingQ(true);
    setQError(null);

    try {
      const created = await askEventQuestion(
        eventId,
        user?.id || null,
        authorName,
        newQuestion.trim()
      );
      setQuestions((prev) => [created, ...prev]);
      setNewQuestion("");
      setGuestName("");
    } catch (err: any) {
      setQError(err?.message || "Failed to submit question");
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const organizerName = user?.name || "Event Organizing Lead";
      await answerEventQuestion(questionId, replyText.trim(), organizerName);

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answer: replyText.trim(),
                answered_by: organizerName,
                answered_at: new Date().toISOString(),
              }
            : q
        )
      );
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      console.error("Failed to answer question:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === "answered") return !!q.answer;
    if (filter === "unanswered") return !q.answer;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-coral" />
            <h2 className="font-display text-xl font-semibold text-cream">
              Discussion &amp; Q&amp;A Forum
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Ask questions regarding rules, team requirements, scheduling, or logistics.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filter === "all" ? "bg-surface text-cream shadow-sm" : "text-muted hover:text-cream"
            }`}
          >
            All ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("answered")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filter === "answered"
                ? "bg-surface text-cream shadow-sm"
                : "text-muted hover:text-cream"
            }`}
          >
            Answered ({questions.filter((q) => !!q.answer).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unanswered")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filter === "unanswered"
                ? "bg-surface text-cream shadow-sm"
                : "text-muted hover:text-cream"
            }`}
          >
            Unanswered ({questions.filter((q) => !q.answer).length})
          </button>
        </div>
      </div>

      {/* Ask Question Box */}
      <form
        onSubmit={handleAskQuestion}
        className="rounded-2xl border border-border bg-surface p-4.5 space-y-3.5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-coral" />
          <h3 className="text-sm font-semibold text-cream">Ask a Question to Organizers</h3>
        </div>

        {qError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
            {qError}
          </div>
        )}

        {!user && (
          <div>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name or registration ID"
              className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
              required
            />
          </div>
        )}

        <div>
          <textarea
            rows={2}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g. Can we bring our own hardware components? Is Wi-Fi provided at the venue?"
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <User className="h-3.5 w-3.5" />
            Posting as: <span className="text-cream font-medium">{user?.name || guestName.trim() || "Guest Student"}</span>
          </div>

          <button
            type="submit"
            disabled={submittingQ || !newQuestion.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50 hover:opacity-95 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
            {submittingQ ? "Submitting..." : "Post Question"}
          </button>
        </div>
      </form>

      {/* Question List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-muted">Loading discussions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium text-cream/80">No questions found in this category</p>
          <p className="mt-1 text-xs text-muted">
            Be the first to ask the organizers about this event!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-border bg-surface p-4.5 space-y-3.5"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cream">
                      {q.user_name}
                    </span>
                    <span className="text-[11px] text-muted">· {formatDate(q.created_at)}</span>
                  </div>
                  <p className="text-sm text-cream/90 leading-relaxed font-medium">
                    {q.question}
                  </p>
                </div>

                {q.answer ? (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Answered
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted">
                    Pending
                  </span>
                )}
              </div>

              {/* Answer Section if available */}
              {q.answer && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      Answered by Organizer ({q.answered_by})
                    </div>
                    {q.answered_at && (
                      <span className="text-[11px] text-emerald-300/60">
                        {formatDate(q.answered_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-cream/90 leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              )}

              {/* Reply Button for Organizer */}
              {canAnswer && !q.answer && replyingId !== q.id && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingId(q.id);
                      setReplyText("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-coral hover:border-coral/40 transition-colors"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply as Organizer
                  </button>
                </div>
              )}

              {/* Reply input form */}
              {replyingId === q.id && (
                <div className="mt-2 rounded-xl border border-coral/30 bg-surface-2 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-coral flex items-center gap-1">
                      <Reply className="h-3.5 w-3.5" /> Replying as {user?.name || "Organizer"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingId(null)}
                      className="text-muted hover:text-cream text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official verified response..."
                    className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-cream focus:border-coral focus:outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAnswerSubmit(q.id)}
                      disabled={submittingReply || !replyText.trim()}
                      className="flex items-center gap-1 rounded-lg bg-coral px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      {submittingReply ? "Posting..." : "Post Verified Answer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
