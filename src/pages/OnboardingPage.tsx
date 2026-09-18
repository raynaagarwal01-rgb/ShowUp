import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { INDIA_STATES } from "../lib/indiaStates";
import { listEvents } from "../lib/db";
import { Logo } from "../components/Logo";
import { CitySelect } from "../components/CitySelect";
import { Field } from "./LoginPage";

export const OnboardingPage: React.FC = () => {
  const { user, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [knownColleges, setKnownColleges] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?redirect=${encodeURIComponent("/onboarding")}`);
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    listEvents().then((events) => {
      setKnownColleges(Array.from(new Set(events.map((e) => e.college))).sort());
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return setError("Select your state.");
    if (!city.trim()) return setError("Enter your city.");

    setBusy(true);
    setError(null);
    const { error } = await updateProfile({
      state,
      city: city.trim(),
      college: college.trim() || undefined,
    });
    setBusy(false);
    if (error) return setError(error);

    const next = params.get("next");
    navigate(next || (user?.role === "organizer" ? "/organizer" : "/dashboard"));
  };

  if (loading || !user) return null;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 self-center">
        <Logo />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <MapPin className="h-6 w-6 text-coral" />
        <h1 className="mt-3 font-display text-2xl font-bold">Where are you joining from?</h1>
        <p className="mt-1 text-sm text-muted">
          Feastify covers events across India — this helps us show you what's happening near you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="State">
            <select
              required
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity("");
              }}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
            >
              <option value="" disabled>
                Select your state
              </option>
              {INDIA_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <CitySelect state={state} value={city} onChange={setCity} />
          </Field>
          <Field label="College (optional)">
            <input
              list="known-colleges"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="e.g. VIT Vellore"
            />
            <datalist id="known-colleges">
              {knownColleges.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-coral py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};
