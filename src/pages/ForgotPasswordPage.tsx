import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { Field } from "./LoginPage";

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await requestPasswordReset(email);
    setBusy(false);
    if (error) return setError(error);
    setEmailSent(true);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        {emailSent ? (
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
        ) : (
          <>
            <KeyRound className="h-6 w-6 text-coral" />
            <h1 className="mt-3 font-display text-2xl font-bold">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted">We'll email you a link to reset it.</p>
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
                {busy ? "Sending..." : "Send reset link"}
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
