import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { isOnboardingComplete } from "../lib/profile";

export const LoginPage: React.FC = () => {
  const { signIn, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error, profile } = await signIn(email, password);
    setBusy(false);
    if (error) return setError(error);

    const redirect = params.get("redirect") || "/dashboard";
    if (profile && !isOnboardingComplete(profile)) {
      navigate(`/onboarding?next=${encodeURIComponent(redirect)}`);
    } else {
      navigate(redirect);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to see your tickets and registrations.</p>

        {isDemoMode && (
          <p className="mt-4 rounded-lg border border-plum/30 bg-plum/10 px-3 py-2 text-xs text-cream/80">
            Demo mode: this account lives only in your browser. Sign up first if you haven't.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <Field label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="••••••••"
            />
          </Field>
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-coral">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link to="/signup" className="font-medium text-coral">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-medium text-cream/70">{label}</span>
    {children}
  </label>
);
