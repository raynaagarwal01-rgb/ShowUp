import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { Field } from "./LoginPage";

export const ResetPasswordPage: React.FC = () => {
  const { user, loading, isDemoMode, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await updatePassword(newPassword);
    setBusy(false);
    if (error) return setError(error);
    navigate("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-coral" />
          </div>
        ) : isDemoMode ? (
          <>
            <h1 className="font-display text-2xl font-bold">This link is for real email resets</h1>
            <p className="mt-1 text-sm text-muted">
              In demo mode, password resets happen directly on the forgot-password page — there's
              no email to click through from.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 block w-full rounded-xl bg-coral py-2.5 text-center text-sm font-semibold text-ink"
            >
              Go there now
            </Link>
          </>
        ) : !user ? (
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
            <p className="mt-1 text-sm text-muted">You're resetting the password for {user.email}.</p>
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
