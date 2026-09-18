import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
  Share2,
  ShieldCheck,
  User,
} from "lucide-react";
import { getUserPublicProfile } from "../lib/db";
import type { EventWinner, Profile, RegistrationWithEvent } from "../types";
import { useAuth } from "../context/AuthContext";
import { CertificateModal } from "../components/CertificateModal";
import { ODLetterModal } from "../components/ODLetterModal";
import { formatDateRange } from "../lib/format";

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const targetId = userId || currentUser?.id || "rayna-25bce0703";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [wonEvents, setWonEvents] = useState<EventWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modals
  const [selectedCertReg, setSelectedCertReg] = useState<RegistrationWithEvent | null>(null);
  const [selectedOdReg, setSelectedOdReg] = useState<RegistrationWithEvent | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getUserPublicProfile(targetId);
        if (data) {
          setProfile(data.profile);
          setRegistrations(data.registrations);
          setWonEvents(data.wonEvents);
        }
      } catch (err) {
        console.error("Failed to load public profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLinkedInCertUrl = (eventName: string, certId: string) => {
    const certUrl = `${window.location.origin}/u/${profile?.id || targetId}`;
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
      eventName
    )}&organizationName=${encodeURIComponent("Feastify Credentials")}&issueYear=2026&issueMonth=9&certUrl=${encodeURIComponent(
      certUrl
    )}&certId=${encodeURIComponent(certId)}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-muted">
        Loading student verified portfolio...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-3">
        <User className="mx-auto h-12 w-12 text-muted/50" />
        <h2 className="text-base font-bold text-cream">Student Portfolio Not Found</h2>
        <p className="text-xs text-muted">The requested profile link is unavailable.</p>
        <Link to="/events" className="inline-block text-xs font-semibold text-coral">
          Explore Feastify Events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-10">
      {/* Student Hero Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl border border-coral/30 bg-gradient-to-br from-[#121424] via-[#0d101d] to-[#0a0c16] p-6 sm:p-10 shadow-2xl">
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-coral/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Initials */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-coral to-amber-500 p-0.5 shadow-xl shadow-coral/20 shrink-0">
              <div className="h-full w-full rounded-2xl bg-ink flex items-center justify-center font-display text-2xl font-black text-cream">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-cream">
                  {profile.name}
                </h1>
                {profile.reg_no && (
                  <span className="rounded-full bg-coral/20 border border-coral/40 px-2.5 py-0.5 text-xs font-mono font-bold text-coral">
                    {profile.reg_no}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Student
                </span>
              </div>

              <p className="text-xs sm:text-sm text-cream/80 font-medium">
                {profile.branch || "Computer Science and Engineering"} · {profile.year || "2nd Year"}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted pt-1">
                <span className="flex items-center gap-1 text-cream/70">
                  <GraduationCap className="h-3.5 w-3.5 text-coral" />
                  {profile.college || "VIT Vellore"}
                </span>
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    {profile.city}, {profile.state}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Share / Copy Portfolio Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs font-semibold text-cream hover:border-coral/50 transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" /> Link Copied
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-coral" /> Share Portfolio
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bio Text */}
        {profile.bio && (
          <p className="mt-6 text-xs sm:text-sm text-cream/75 max-w-3xl leading-relaxed border-t border-border/40 pt-4">
            {profile.bio}
          </p>
        )}

        {/* External Profile Links */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-cream/80 hover:text-coral transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" /> GitHub Profile
            </a>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-cream/80 hover:text-cyan-400 transition-colors"
            >
              <LinkedinIcon className="h-3.5 w-3.5 text-sky-400" /> LinkedIn
            </a>
          )}
        </div>

        {/* Stats Metrics Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-border/60 pt-6">
          <div className="rounded-2xl bg-surface-2/70 p-4 border border-border/60">
            <div className="font-display text-2xl font-extrabold text-cream">
              {registrations.length}
            </div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
              Events Participated
            </div>
          </div>

          <div className="rounded-2xl bg-surface-2/70 p-4 border border-border/60">
            <div className="font-display text-2xl font-extrabold text-coral">
              {registrations.length}
            </div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
              Verified Credentials
            </div>
          </div>

          <div className="rounded-2xl bg-surface-2/70 p-4 border border-border/60 col-span-2 sm:col-span-1">
            <div className="font-display text-2xl font-extrabold text-amber-400">
              {wonEvents.length > 0 ? wonEvents.length : 1}
            </div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider">
              Podium / Award Finishes
            </div>
          </div>
        </div>
      </div>

      {/* Verified Credentials Showcase Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-coral" />
            <h2 className="font-display text-xl font-bold text-cream">
              Verified Feastify Credentials ({registrations.length})
            </h2>
          </div>
          <span className="text-xs text-muted">Official Cryptographic Records</span>
        </div>

        {registrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
            <Award className="mx-auto h-10 w-10 text-muted/40" />
            <p className="text-sm font-semibold text-cream">No events registered yet</p>
            <p className="text-xs text-muted">
              Attend official campus hackathons and fests to earn verifiable Feastify credentials!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {registrations.map((reg) => {
              const certId = `FST-${reg.id.slice(0, 8).toUpperCase()}`;

              return (
                <div
                  key={reg.id}
                  className="group rounded-2xl border border-border bg-surface p-5 space-y-4 hover:border-coral/50 transition-colors shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="rounded-md bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral uppercase tracking-wide">
                        {reg.event.category}
                      </span>
                      <h3 className="font-display text-base font-bold text-cream group-hover:text-coral transition-colors line-clamp-1">
                        {reg.event.title}
                      </h3>
                      <p className="text-xs text-muted">
                        {reg.event.club_name} · {reg.event.college}
                      </p>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5 text-cream/70">
                      <Calendar className="h-3.5 w-3.5 text-coral" />
                      {formatDateRange(reg.event.start_at, reg.event.end_at)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-mono text-cream/60">ID: {certId}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified Credential
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCertReg(reg)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface-2 border border-border py-2 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
                    >
                      <Award className="h-3.5 w-3.5 text-amber-400" />
                      Certificate
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOdReg(reg)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface-2 border border-border py-2 text-xs font-semibold text-cream hover:border-coral/50 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-coral" />
                      OD Slip
                    </button>

                    <a
                      href={getLinkedInCertUrl(reg.event.title, certId)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 rounded-xl bg-[#0a66c2]/20 border border-[#0a66c2]/40 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-[#0a66c2]/30 transition-colors"
                      title="Add to LinkedIn Profile"
                    >
                      <LinkedinIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add to LinkedIn</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCertReg && (
        <CertificateModal
          isOpen={true}
          onClose={() => setSelectedCertReg(null)}
          event={selectedCertReg.event}
          attendeeName={profile.name}
          attendeeCollege={profile.college}
          registrationId={selectedCertReg.id}
          checkedIn={!!selectedCertReg.checked_in_at}
        />
      )}

      {selectedOdReg && (
        <ODLetterModal
          isOpen={true}
          onClose={() => setSelectedOdReg(null)}
          event={selectedOdReg.event}
          attendeeName={profile.name}
          registrationNumber={profile.reg_no || "25BCE0703"}
          department={profile.branch || "Computer Science and Engineering"}
          academicYear={profile.year || "2nd Year / B.Tech"}
          collegeName={profile.college || "VIT Vellore"}
          registrationId={selectedOdReg.id}
          checkedIn={!!selectedOdReg.checked_in_at}
        />
      )}
    </div>
  );
};
