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
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [knownColleges, setKnownColleges] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?redirect=${encodeURIComponent("/onboarding")}`);
    }
  }, [loading, user, navigate]);

  // Pre-fill from whatever's already on the profile — e.g. someone who set
  // state/city before phone became required shouldn't have to redo those.
  useEffect(() => {
    if (!user) return;
    setState((s) => s || user.state || "");
    setCity((c) => c || user.city || "");
    setCollege((c) => c || user.college || "");
    setPhone((p) => p || user.phone || "");
  }, [user]);

  useEffect(() => {
    listEvents().then((events) => {
      setKnownColleges(Array.from(new Set(events.map((e) => e.college))).sort());
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return setError("Select your state.");
    if (!city.trim()) return setError("Enter your city.");
    if (!phone.trim()) return setError("Enter your phone number.");
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return setError("Please enter a valid 10-digit mobile number for SMS notifications.");
    }

    setBusy(true);
    setError(null);
    const { error } = await updateProfile({
      state,
      city: city.trim(),
      college: college.trim() || undefined,
      phone: phone.trim(),
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
          ShowUp covers events across India — this helps us show you what's happening near you,
          and where to send your registration confirmations.
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
          <Field label="Phone number (for SMS & WhatsApp)">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none"
              placeholder="+91 98765 43210"
            />
            <p className="mt-1 text-xs text-muted">Used to send your ticket confirmation and event updates via SMS.</p>
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
