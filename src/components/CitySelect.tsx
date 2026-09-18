import React, { useMemo, useState } from "react";
import { citiesForState, OTHER_CITY } from "../lib/indiaCities";

const inputClass =
  "w-full rounded-xl border border-border bg-ink px-3.5 py-2.5 text-sm focus:border-coral focus:outline-none";

interface CitySelectProps {
  state: string;
  value: string;
  onChange: (city: string) => void;
  /** Cities to offer even though they're not in the curated list — e.g. ones
   * organizers already added for this state via "Other". Keeps every real
   * event reachable even if our list didn't happen to include its city. */
  extraCities?: string[];
  required?: boolean;
}

/** A city dropdown scoped to `state`, with an "Other" option that reveals a
 * free-text field — so a real town we didn't curate is never unreachable. */
export const CitySelect: React.FC<CitySelectProps> = ({
  state,
  value,
  onChange,
  extraCities = [],
  required = true,
}) => {
  const options = useMemo(() => {
    const curated = citiesForState(state);
    return Array.from(new Set([...curated, ...extraCities])).sort();
  }, [state, extraCities]);

  const [manualMode, setManualMode] = useState(false);
  // A saved value that isn't in the list (e.g. a custom city entered earlier)
  // should also land in manual mode, even before the user touches anything.
  const isCustom = manualMode || (value !== "" && !options.includes(value));

  if (isCustom) {
    return (
      <div className="space-y-2">
        <input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your city"
          className={inputClass}
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setManualMode(false);
            onChange("");
          }}
          className="text-xs font-medium text-coral"
        >
          Choose from a list instead
        </button>
      </div>
    );
  }

  return (
    <select
      required={required}
      value={value}
      onChange={(e) => {
        if (e.target.value === OTHER_CITY) {
          setManualMode(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      disabled={!state}
      className={`${inputClass} disabled:opacity-50`}
    >
      <option value="" disabled>
        {state ? "Select your city" : "Select a state first"}
      </option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
      <option value={OTHER_CITY}>Other (type it in)</option>
    </select>
  );
};
