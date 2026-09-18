import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Profile } from "../types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (patch: Partial<Profile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { user, updateProfile } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalizeUrl = (value: string, host: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${host}/${trimmed.replace(/^\/+/, "")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const patch: Partial<Profile> = {
      bio: bio.trim(),
      github: normalizeUrl(github, "github.com"),
      linkedin: normalizeUrl(linkedin, "linkedin.com/in"),
    };
    const { error: err } = await updateProfile(patch);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved(patch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3.5">
          <p className="text-sm font-semibold text-cream">Edit your portfolio</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface hover:text-cream transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] text-muted block mb-1">Short bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A sentence or two about what you build and what you're into."
              maxLength={280}
              className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted block mb-1">GitHub</label>
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="github.com/yourhandle or just yourhandle"
              className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted block mb-1">LinkedIn</label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="linkedin.com/in/yourname or just yourname"
              className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-sm text-cream placeholder:text-muted focus:border-coral focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-coral px-4 py-2 text-xs font-bold text-ink disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
