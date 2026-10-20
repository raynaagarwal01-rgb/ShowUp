import React, { useEffect, useState } from "react";
import { Check, Copy, Crown, Share2, UserPlus, Users, X } from "lucide-react";
import { getTeam } from "../lib/api";
import type { TeamDetails } from "../types";

interface TeamHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  currentUserId?: number;
}

export const TeamHubModal: React.FC<TeamHubModalProps> = ({ isOpen, onClose, teamId, currentUserId }) => {
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "invite" | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getTeam(teamId)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  const copy = (text: string, what: "code" | "invite") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const inviteText = team
    ? `Join my team "${team.name}" for ${team.event_title} on ShowUp!\n` +
      `1. Sign up at ${window.location.origin}/signup\n` +
      `2. Open ${window.location.origin}/events/${team.event_id}\n` +
      `3. Choose "Join with code" and enter: ${team.join_code}`
    : "";

  const memberCount = team?.members.length ?? 0;
  const maxTeam = team?.team_max ?? 1;
  const needed = Math.max(0, (team?.team_min ?? 0) - memberCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-coral/15 p-2 text-coral">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-cream">My Team</h2>
              <p className="text-xs text-muted">{team ? `"${team.name}"` : "Team details"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:text-cream">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted">Loading team...</div>
          ) : !team ? (
            <div className="py-8 text-center text-xs text-muted">Team information unavailable.</div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-surface-2/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cream truncate max-w-[280px]">{team.event_title}</span>
                  <span className="rounded-full bg-coral/20 px-2 py-0.5 font-bold text-coral text-[11px]">
                    {memberCount} / {maxTeam} members
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-coral rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (memberCount / maxTeam) * 100)}%` }}
                  />
                </div>
                {needed > 0 && (
                  <p className="text-[11px] text-warning">
                    This event needs at least {team.team_min} members — {needed} more to go.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream/70">Team join code</span>
                  <span className="text-[11px] text-coral font-medium">Share with teammates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-coral/40 bg-ink px-4 py-2.5 font-mono text-lg font-black tracking-widest text-coral text-center select-all">
                    {team.join_code}
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(team.join_code, "code")}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
                  >
                    {copied === "code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted" />}
                    {copied === "code" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => copy(inviteText, "invite")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-2.5 text-xs font-bold text-ink transition-all hover:opacity-90"
                >
                  {copied === "invite" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied === "invite" ? "Invite message copied" : "Copy invite message"}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-coral" /> Members ({memberCount})
                </h3>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3 text-xs">
                      <div className="h-8 w-8 rounded-full bg-coral/20 border border-coral/40 flex items-center justify-center font-bold text-coral text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-cream flex items-center gap-1.5">
                          <span>
                            {member.name}
                            {member.id === currentUserId && " (you)"}
                          </span>
                          {member.id === team.leader_id && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-400">
                              <Crown className="h-3 w-3" /> Leader
                            </span>
                          )}
                        </div>
                        {member.college && <div className="text-[11px] text-muted">{member.college}</div>}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, maxTeam - memberCount) }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-border/80 p-3 text-xs text-muted"
                    >
                      <UserPlus className="h-4 w-4 text-muted/60" />
                      <span>
                        Open slot · share code <strong>{team.join_code}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 px-6 py-3 text-xs">
          <span className="text-muted">Joining closes at the registration deadline.</span>
          <button type="button" onClick={onClose} className="rounded-xl bg-coral px-4 py-1.5 text-xs font-semibold text-ink hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
