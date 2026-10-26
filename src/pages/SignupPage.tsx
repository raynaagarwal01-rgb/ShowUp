import React, { useState } from "react";
import { ArrowUpRight, Eye, EyeOff, TicketCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field } from "./LoginPage";
import type { Role } from "../types";

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

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("redirect"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [college, setCollege] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const passwordBytes = new TextEncoder().encode(password).length;
    if (passwordBytes < 6 || passwordBytes > 72) {
      setError("Use a password between 6 and 72 bytes. Most letters and numbers count as one byte.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await signUp({
        name,
        email,
        password,
        role,
        college: college.trim() || undefined,
        reg_no: role === "student" ? regNo.trim() || undefined : undefined,
      });
      if (result.error) return setError(result.error);
      navigate(returnTo || (role === "organizer" ? "/organizer" : "/dashboard"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center px-4 py-10">
      <section className="panel w-full max-w-lg p-6 sm:p-8">
        <Link to="/events" aria-label="ShowUp events" className="mb-7 inline-flex items-center gap-2 text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white"><TicketCheck size={19} /></span>
          <span className="text-lg font-semibold tracking-tight">ShowUp</span>
          <ArrowUpRight size={14} className="text-muted" aria-hidden="true" />
        </Link>
        <p className="eyebrow">MAKE IT YOURS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Create your account.</h1>
        <p className="mt-2 text-sm text-muted">One place for campus events and the people who make them happen.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={role === "organizer" ? "Club or organizer name" : "Full name"}>
            <input className="field" required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Rao" />
          </Field>
          <Field label="Email">
            <input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
          </Field>
          <div className="block space-y-1.5">
            <span id="signup-password-label" className="block text-sm font-medium text-ink">Password</span>
            <div className="relative">
              <input className="field pr-12" type={showPassword ? "text" : "password"} aria-labelledby="signup-password-label" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-help" />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-2 grid w-10 place-items-center text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <span id="password-help" className="block text-xs text-muted">6–72 bytes. Emoji and some accented characters use more than one byte.</span>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-ink">I’m joining as</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["student", "organizer"] as Role[]).map((value) => (
                <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(value)} className={`btn-secondary capitalize ${role === value ? "border-ink bg-surface font-semibold text-ink" : "text-muted"}`}>
                  {value === "student" ? "Attendee" : "Club organizer"}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="College (optional)">
            <input className="field" maxLength={150} autoComplete="organization" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="VIT Vellore" />
          </Field>
          {role === "student" && <Field label="Registration number (optional)">
            <input className="field" maxLength={30} value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="25BCE0703" />
          </Field>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link to={returnTo ? `/login?redirect=${encodeURIComponent(returnTo)}` : "/login"} className="font-medium text-ink underline underline-offset-4">Sign in</Link>
        </p>
      </section>
    </main>
  );
};
