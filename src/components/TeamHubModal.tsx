import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  Edit3,
  Lightbulb,
  Share2,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { getTeamDetails, removeTeamMember, updateTeamIdea } from "../lib/db";
import type { EventRecord, Profile, Team } from "../types";
import { formatDateRange } from "../lib/format";

interface TeamHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  currentUserId?: string;
  onTeamUpdated?: () => void;
}

export const TeamHubModal: React.FC<TeamHubModalProps> = ({
  isOpen,
  onClose,
  teamId,
  currentUserId,
  onTeamUpdated,
}) => {
  const [data, setData] = useState<{ team: Team; members: Profile[]; event: EventRecord } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [ideaDraft, setIdeaDraft] = useState("");
  const [savingIdea, setSavingIdea] = useState(false);

  const fetchTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const details = await getTeamDetails(teamId);
      setData(details);
    } catch (err) {
      console.error("Failed to load team details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTeam();
    }
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!data?.team.join_code) return;
    navigator.clipboard.writeText(data.team.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const { team, event } = data;
    const shareText = `🚀 *Join my team for ${event.title}!*
Hey! I've created the team "${team.name}" on ShowUp for ${event.title}.

🔑 *Team Join Code:* ${team.join_code}
📍 *Venue:* ${event.venue}
📅 *Schedule:* ${formatDateRange(event.start_at, event.end_at)}

Register and enter our join code here:
${window.location.origin}/events/${event.id}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!data || !window.confirm("Are you sure you want to remove this member from your team?")) return;
    setRemoving(memberId);
    try {
      await removeTeamMember(data.team.id, memberId);
      await fetchTeam();
      onTeamUpdated?.();
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setRemoving(null);
    }
  };

  const handleSaveIdea = async () => {
    if (!data) return;
    setSavingIdea(true);
    try {
      await updateTeamIdea(data.team.id, ideaDraft);
      await fetchTeam();
      setIsEditingIdea(false);
      onTeamUpdated?.();
    } catch (err) {
      console.error("Failed to update project idea:", err);
    } finally {
      setSavingIdea(false);
    }
  };

  const isLeader = (data?.team.leader_id || data?.team.created_by) === currentUserId;
  const maxTeam = data?.event.team_max || 4;
  const currentMembersCount = data?.members.length || 0;
  const emptySlotsCount = Math.max(0, maxTeam - currentMembersCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-coral/15 p-2 text-coral">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-cream">
                Team Hub &amp; Roster
              </h2>
              <p className="text-xs text-muted">
                {data?.team.name ? `"${data.team.name}"` : "Team Management"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted">Loading team details...</div>
          ) : !data ? (
            <div className="py-8 text-center text-xs text-muted">Team information unavailable.</div>
          ) : (
            <>
              {/* Event & Team Info Banner */}
              <div className="rounded-xl border border-border bg-surface-2/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cream truncate max-w-[280px]">
                    {data.event.title}
                  </span>
                  <span className="rounded-full bg-coral/20 px-2 py-0.5 font-bold text-coral text-[11px]">
                    {currentMembersCount} / {maxTeam} Members
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-coral rounded-full transition-all duration-300"
                    style={{ width: `${(currentMembersCount / maxTeam) * 100}%` }}
                  />
                </div>
              </div>

              {/* Secret Join Code & Fast WhatsApp Invite */}
              <div className="rounded-2xl border border-coral/30 bg-coral/5 p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream/70">
                    Team Secret Join Code
                  </span>
                  <span className="text-[11px] text-coral font-medium">Share with teammates</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-coral/40 bg-ink px-4 py-2.5 font-mono text-lg font-black tracking-widest text-coral text-center select-all">
                    {data.team.join_code}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-muted" /> Copy
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click WhatsApp Share Button */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Invite Teammates via WhatsApp
                </button>
              </div>

              {/* Team Project Idea / Problem Statement */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>Project Idea / Pitch</span>
                  </div>
                  {isLeader && !isEditingIdea && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdeaDraft(data.team.project_idea || "");
                        setIsEditingIdea(true);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" /> Edit Pitch
                    </button>
                  )}
                </div>

                {isEditingIdea ? (
                  <div className="space-y-2">
                    <textarea
                      value={ideaDraft}
                      onChange={(e) => setIdeaDraft(e.target.value)}
                      rows={3}
                      placeholder="Describe what your team is building or the problem you're tackling..."
                      className="w-full rounded-xl border border-amber-500/40 bg-ink p-2.5 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingIdea(false)}
                        className="rounded-lg px-2.5 py-1 text-xs text-muted hover:text-cream"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingIdea}
                        onClick={handleSaveIdea}
                        className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-xs font-semibold text-ink flex items-center gap-1 transition-colors"
                      >
                        {savingIdea ? "Saving..." : "Save Idea"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-cream/90 italic leading-relaxed">
                    {data.team.project_idea ? `"${data.team.project_idea}"` : (
                      <span className="text-muted not-italic">
                        No project idea submitted yet.{isLeader ? " Click 'Edit Pitch' to tell organizers and judges what your team is building." : ""}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Member Roster List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-coral" /> Confirmed Teammates ({currentMembersCount})
                </h3>

                <div className="space-y-2">
                  {data.members.map((member) => {
                    const isMemberLeader = member.id === (data.team.leader_id || data.team.created_by);
                    const canRemove = isLeader && !isMemberLeader;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-coral/20 border border-coral/40 flex items-center justify-center font-bold text-coral text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-cream flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isMemberLeader && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-bold text-amber-400">
                                  <Crown className="h-3 w-3" /> Leader
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted">
                              {member.college || "VIT Vellore"} {member.reg_no ? `· ${member.reg_no}` : ""}
                            </div>
                          </div>
                        </div>

                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removing === member.id}
                            className="rounded-lg p-1.5 text-muted hover:text-red-400 transition-colors"
                            title="Remove from team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty Slot Placeholders */}
                  {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-border/80 p-3 text-xs text-muted"
                    >
                      <UserPlus className="h-4 w-4 text-muted/60" />
                      <span>Slot Open · Share join code <strong>{data.team.join_code}</strong> to add teammate</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 px-6 py-3 text-xs">
          <span className="text-muted">Teams lock when capacity is reached or deadline closes.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-coral px-4 py-1.5 text-xs font-semibold text-ink hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
