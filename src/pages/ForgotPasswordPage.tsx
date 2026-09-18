import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { Field } from "./LoginPage";

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, updatePassword, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Supabase mode: this is the end state — an email is on its way.
  const [emailSent, setEmailSent] = useState(false);

  // Demo mode: no email transport, so once the account is confirmed to
  // exist we collect the new password right here instead of pretending
  // to send something nobody will receive.
  const [demoStep, setDemoStep] = useState<"email" | "newPassword">("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [demoDone, setDemoDone] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await requestPasswordReset(email);
    setBusy(false);
    if (error) return setError(error);
    if (isDemoMode) {
      setDemoStep("newPassword");
    } else {
      setEmailSent(true);
    }
  };

  const handleDemoPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError("Passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await updatePassword(newPassword, email);
    setBusy(false);
    if (error) return setError(error);
    setDemoDone(true);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {demoDone ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-success" />
            <h1 className="mt-3 font-display text-2xl font-bold">Password updated</h1>
            <p className="mt-1 text-sm text-muted">You can sign in with your new password now.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
            >
              Back to sign in
            </button>
          </>
        ) : emailSent ? (
          <>
            <CheckCircle2 className="h-6 w-6 text-success" />
            <h1 className="mt-3 font-display text-2xl font-bold">Check your email</h1>
            <p className="mt-1 text-sm text-muted">
              If an account exists for <span className="text-cream">{email}</span>, a reset link is on
              its way. Open it to choose a new password.
            </p>
            <Link
              to="/login"
              className="mt-6 block w-full rounded-xl border border-border py-2.5 text-center text-sm font-medium text-cream/80 hover:border-coral/50"
            >
              Back to sign in
            </Link>
          </>
        ) : demoStep === "newPassword" ? (
          <>
            <KeyRound className="h-6 w-6 text-coral" />
            <h1 className="mt-3 font-display text-2xl font-bold">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted">
              Demo mode has no email to send — set your new password directly.
            </p>
            <form onSubmit={handleDemoPasswordSubmit} className="mt-6 space-y-4">
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
        ) : (
          <>
            <KeyRound className="h-6 w-6 text-coral" />
            <h1 className="mt-3 font-display text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted">
              {isDemoMode
                ? "Enter the email you signed up with."
                : "We'll email you a link to reset it."}
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
                  placeholder="you@college.edu"
                />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "Sending..." : isDemoMode ? "Continue" : "Send reset link"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              <Link to="/login" className="font-medium text-coral">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
