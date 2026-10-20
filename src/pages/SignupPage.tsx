import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import { Field } from "./LoginPage";
import type { Role } from "../types";

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [college, setCollege] = useState("");
  const [regNo, setRegNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signUp({
      name,
      email,
      password,
      role,
      college: college.trim() || undefined,
      reg_no: role === "student" ? regNo.trim() || undefined : undefined,
    });
    setBusy(false);
    if (error) return setError(error);
    navigate(params.get("redirect") || (role === "organizer" ? "/organizer" : "/dashboard"));
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-8 self-center">
        <Logo />
      </Link>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">One profile for every college event across India.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={role === "organizer" ? "Club or organizer name" : "Full name"}>
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="Ananya Rao"
            />
          </Field>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="At least 6 characters"
            />
          </Field>
          <Field label="I'm signing up as">
            <div className="grid grid-cols-2 gap-2">
              {(["student", "organizer"] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border py-2.5 text-sm font-medium capitalize transition-colors ${
                    role === r ? "border-coral bg-coral/15 text-coral-light" : "border-border text-cream/70"
                  }`}
                >
                  {r === "student" ? "Attendee" : "Club organizer"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="College (optional)">
            <input
              value={college}
              maxLength={150}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="e.g. VIT Vellore"
            />
          </Field>
          {role === "student" && (
            <Field label="Registration number (optional)">
              <input
                value={regNo}
                maxLength={30}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm uppercase focus:border-coral focus:outline-none"
                placeholder="e.g. 25BCE0703"
              />
            </Field>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-coral">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
