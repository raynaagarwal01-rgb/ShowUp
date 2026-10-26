import React, { useState } from "react";
import { ArrowUpRight, Eye, EyeOff, TicketCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const safeReturnTo = (value: string | null): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (["/events", "/dashboard", "/organizer"].some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }
  return null;
};

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signIn(email, password);
      if (result.error) return setError(result.error);
      navigate(returnTo || (result.user?.role === "organizer" ? "/organizer" : "/dashboard"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell flex min-h-[75vh] items-center justify-center px-4 py-12">
      <section className="panel w-full max-w-md p-6 sm:p-8">
        <Link to="/events" aria-label="ShowUp events" className="mb-8 inline-flex items-center gap-2 text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white"><TicketCheck size={19} /></span>
          <span className="text-lg font-semibold tracking-tight">ShowUp</span>
          <ArrowUpRight size={14} className="text-muted" aria-hidden="true" />
        </Link>
        <p className="eyebrow">YOUR EVENT PASS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Welcome back.</h1>
        <p className="mt-2 text-sm text-muted">Sign in to pick up where you left off.</p>
        {returnTo && <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">Sign in to continue to your event.</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
          </Field>
          <div className="block space-y-1.5">
            <span id="login-password-label" className="block text-sm font-medium text-ink">Password</span>
            <div className="relative">
              <input className="field pr-12" type={showPassword ? "text" : "password"} aria-labelledby="login-password-label" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-2 grid w-10 place-items-center text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          New to ShowUp? <Link to={returnTo ? `/signup?redirect=${encodeURIComponent(returnTo)}` : "/signup"} className="font-medium text-ink underline underline-offset-4">Create an account</Link>
        </p>
      </section>
    </main>
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="block text-sm font-medium text-ink">{label}</span>
    {children}
  </label>
);
