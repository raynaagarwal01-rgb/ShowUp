import React, { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, MessageSquare, Reply, Send, ShieldCheck, User } from "lucide-react";
import { answerQuestion, askQuestion, listQuestions } from "../lib/api";
import type { EventQuestion } from "../types";
import { useAuth } from "../context/AuthContext";

interface Props {
  eventId: number;
  /** True when the signed-in user created this event — only they can answer. */
  isOrganizer?: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const EventQnATab: React.FC<Props> = ({ eventId, isOrganizer = false }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered">("all");

  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    listQuestions(eventId)
      .then(setQuestions)
      .catch(() => setError("Couldn't load questions."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setSubmittingQ(true);
    setError(null);
    try {
      const created = await askQuestion(eventId, newQuestion.trim());
      setQuestions((prev) => [created, ...prev]);
      setNewQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit question");
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleAnswerSubmit = async (questionId: number) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    setError(null);
    try {
      await answerQuestion(questionId, replyText.trim());
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: replyText.trim() } : q)));
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post answer");
    } finally {
      setSubmittingReply(false);
    }
  };

  const answeredCount = questions.filter((q) => q.answer).length;
  const filteredQuestions = questions.filter((q) => {
    if (filter === "answered") return !!q.answer;
    if (filter === "unanswered") return !q.answer;
    return true;
  });

  const filterButton = (value: typeof filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
        filter === value ? "bg-surface text-cream shadow-sm" : "text-muted hover:text-cream"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-coral" />
            <h2 className="font-display text-xl font-semibold text-cream">Questions &amp; Answers</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Ask the organizer about rules, teams, timings or logistics.</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border text-xs">
          {filterButton("all", `All (${questions.length})`)}
          {filterButton("answered", `Answered (${answeredCount})`)}
          {filterButton("unanswered", `Unanswered (${questions.length - answeredCount})`)}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">{error}</div>}

      {user && !isOrganizer && (
        <form onSubmit={handleAskQuestion} className="rounded-2xl border border-border bg-surface p-4.5 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-coral" />
            <h3 className="text-sm font-semibold text-cream">Ask the organizer</h3>
          </div>
          <textarea
            rows={2}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g. Can we bring our own hardware? Is Wi-Fi provided?"
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-cream placeholder-muted focus:border-coral focus:outline-none"
            required
          />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-muted">
              <User className="h-3.5 w-3.5" />
              Posting as: <span className="text-cream font-medium">{user.name}</span>
            </div>
            <button
              type="submit"
              disabled={submittingQ || !newQuestion.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-coral px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50 hover:opacity-95 transition-opacity"
            >
              <Send className="h-3.5 w-3.5" />
              {submittingQ ? "Submitting..." : "Post question"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-muted">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted/50 mb-2" />
          <p className="text-sm font-medium text-cream/80">No questions here yet</p>
          <p className="mt-1 text-xs text-muted">Be the first to ask the organizer about this event!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-border bg-surface p-4.5 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-cream">{q.user_name}</span>
                    <span className="text-[11px] text-muted">· {formatDate(q.created_at)}</span>
                  </div>
                  <p className="text-sm text-cream/90 leading-relaxed font-medium">{q.question}</p>
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

              {q.answer && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Organizer's answer
                  </div>
                  <p className="text-sm text-cream/90 leading-relaxed">{q.answer}</p>
                </div>
              )}

              {isOrganizer && !q.answer && replyingId !== q.id && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingId(q.id);
                    setReplyText("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-coral hover:border-coral/40 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Answer
                </button>
              )}

              {replyingId === q.id && (
                <div className="mt-2 rounded-xl border border-coral/30 bg-surface-2 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-coral flex items-center gap-1">
                      <Reply className="h-3.5 w-3.5" /> Your answer
                    </span>
                    <button type="button" onClick={() => setReplyingId(null)} className="text-muted hover:text-cream text-[11px]">
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your answer..."
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
                      {submittingReply ? "Posting..." : "Post answer"}
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
