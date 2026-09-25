import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { Field } from "./LoginPage";

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // The single-use token from the emailed link: /reset-password?token=...
  const token = params.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set when the server rejects the token (expired or already used).
  const [invalidLink, setInvalidLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await resetPassword(token, newPassword);
    setBusy(false);
    if (error) {
      // A rejected token means the link is dead; anything else is fixable in place.
      if (/reset link/i.test(error)) return setInvalidLink(true);
      return setError(error);
    }
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {!token || invalidLink ? (
          <>
            <h1 className="font-display text-2xl font-bold">This reset link isn't valid</h1>
            <p className="mt-1 text-sm text-muted">
              It may have expired, or already been used. Request a fresh one.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 block w-full rounded-xl bg-coral py-2.5 text-center text-sm font-semibold text-ink"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <KeyRound className="h-6 w-6 text-coral" />
            <h1 className="mt-3 font-display text-2xl font-bold">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted">Pick a new password for your ShowUp account.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="New password">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
                  placeholder="At least 6 characters"
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
                  placeholder="Re-enter the password"
                />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "Saving..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
