import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Compass,
  ExternalLink,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Sparkles,
  Train,
  X,
} from "lucide-react";
import type { EventRecord } from "../types";
import {
  calculateDistanceKm,
  getEventCoordinates,
  getGoogleMapsDirectionsUrl,
  getTravelEstimate,
  isVitVelloreEvent,
  KNOWN_CITIES,
  type GeoCoordinates,
  type TravelEstimate,
} from "../lib/locationDistance";

interface EventLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
}

export const EventLocationModal: React.FC<EventLocationModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCityName, setUserCityName] = useState<string>("Your Location");

  const destCoords = getEventCoordinates(event);
  const isVIT = isVitVelloreEvent(event);

  // Attempt to auto-locate via browser GPS on open
  useEffect(() => {
    if (!isOpen) return;

    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Your Live Location (GPS)",
          });
          setUserCityName("Your Live Location");
          setLocating(false);
          setLocationError(null);
        },
        (error) => {
          console.warn("Geolocation prompt skipped or denied:", error.message);
          setLocating(false);
          // Fallback: If user has a registered city or default to Vellore/Chennai
          setLocationError("GPS location disabled. Select your city below to calculate distance.");
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser. Pick a city below.");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate distance if user coordinates are known
  let estimate: TravelEstimate | null = null;
  if (userCoords) {
    const km = calculateDistanceKm(
      userCoords.lat,
      userCoords.lng,
      destCoords.lat,
      destCoords.lng
    );
    estimate = getTravelEstimate(km);
  }

  const handleManualCitySelect = (cityKey: string) => {
    const city = KNOWN_CITIES[cityKey];
    if (city) {
      setUserCoords(city);
      setUserCityName(city.name || cityKey);
      setLocationError(null);
    }
  };

  const gmapsUrl = getGoogleMapsDirectionsUrl(event, userCoords || undefined);

  // OpenStreetMap embed coordinates bounding box
  const delta = 0.012;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(
    destCoords.lng - delta
  ).toFixed(4)}%2C${(destCoords.lat - delta).toFixed(4)}%2C${(
    destCoords.lng + delta
  ).toFixed(4)}%2C${(destCoords.lat + delta).toFixed(4)}&layer=mapnik&marker=${
    destCoords.lat
  }%2C${destCoords.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-coral/20 p-2 text-coral">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-cream">
                Event Venue &amp; Distance
              </h2>
              <p className="text-xs text-muted truncate max-w-sm">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-cream transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Destination Summary Card */}
          <div className="rounded-2xl border border-border bg-surface-2/60 p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-coral">
                  Destination Venue
                </span>
                <h3 className="text-lg font-bold text-cream flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-coral shrink-0" />
                  {event.venue}
                </h3>
                <p className="text-xs text-muted">
                  {event.college} · {event.city}, {event.state}
                </p>
              </div>

              {isVIT && (
                <Link
                  to="/campus-map"
                  onClick={onClose}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-coral/40 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral hover:bg-coral/20 transition-colors"
                  title="Open 2D Campus Map"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Campus Map
                </Link>
              )}
            </div>

            {isVIT && (
              <div className="rounded-xl bg-ink/40 border border-border/60 p-3 text-xs text-cream/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-cream">VIT Vellore Campus</span>
                  <span className="text-muted ml-2">Main Campus, Katpadi Road</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  On-Campus Navigation Available
                </span>
              </div>
            )}
          </div>

          {/* Distance From Your Place Section */}
          <div className="rounded-2xl border border-coral/30 bg-coral/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LocateFixed className="h-4 w-4 text-coral" />
                <h4 className="text-sm font-bold text-cream">
                  Distance From Your Place
                </h4>
              </div>

              {locating ? (
                <span className="text-xs text-muted animate-pulse">Detecting GPS...</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLocating(true);
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => {
                        setUserCoords({
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                          name: "Your Live Location (GPS)",
                        });
                        setUserCityName("Your Live Location");
                        setLocating(false);
                        setLocationError(null);
                      },
                      () => {
                        setLocating(false);
                        setLocationError("Could not detect location. Select a city below.");
                      }
                    );
                  }}
                  className="text-xs font-medium text-coral hover:underline"
                >
                  Re-detect GPS
                </button>
              )}
            </div>

            {estimate ? (
              <div className="space-y-3">
                {/* Distance & Time Highlight */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-surface border border-border/80 p-3">
                    <span className="text-[10px] font-semibold uppercase text-muted">
                      Direct Distance
                    </span>
                    <div className="text-xl font-extrabold text-coral mt-0.5">
                      {estimate.distanceKm} km
                    </div>
                    <span className="text-[10px] text-muted truncate block">
                      From {userCityName}
                    </span>
                  </div>

                  <div className="rounded-xl bg-surface border border-border/80 p-3">
                    <span className="text-[10px] font-semibold uppercase text-muted flex items-center gap-1">
                      <Car className="h-3 w-3 text-cyan-400" /> Approx. Drive
                    </span>
                    <div className="text-xl font-extrabold text-cream mt-0.5">
                      {estimate.drivingTimeText}
                    </div>
                    <span className="text-[10px] text-muted">Road travel</span>
                  </div>

                  {estimate.walkingTimeText ? (
                    <div className="rounded-xl bg-surface border border-border/80 p-3 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-semibold uppercase text-muted flex items-center gap-1">
                        <Footprints className="h-3 w-3 text-emerald-400" /> Walking Time
                      </span>
                      <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                        {estimate.walkingTimeText}
                      </div>
                      <span className="text-[10px] text-muted">Pedestrian route</span>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-surface border border-border/80 p-3 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-semibold uppercase text-muted flex items-center gap-1">
                        <Train className="h-3 w-3 text-amber-400" /> Recommended Mode
                      </span>
                      <div className="text-xs font-bold text-amber-300 mt-1">
                        {estimate.transitSummary}
                      </div>
                    </div>
                  )}
                </div>

                {estimate.isOnCampus && (
                  <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>
                      You are already on or right next to campus! The venue is just a short{" "}
                      <strong>{estimate.walkingTimeText || "few minutes walk"}</strong> away.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted">
                {locationError || "Allow browser location to instantly calculate distance and driving time."}
              </div>
            )}

            {/* Quick city selectors fallback */}
            <div className="pt-2 border-t border-border/40">
              <span className="text-[11px] font-medium text-muted block mb-2">
                Calculate distance from a specific city:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "vellore", label: "VIT / Vellore" },
                  { key: "chennai", label: "Chennai" },
                  { key: "bengaluru", label: "Bengaluru" },
                  { key: "hyderabad", label: "Hyderabad" },
                  { key: "mumbai", label: "Mumbai" },
                  { key: "delhi", label: "Delhi / NCR" },
                  { key: "coimbatore", label: "Coimbatore" },
                  { key: "tirupati", label: "Tirupati" },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleManualCitySelect(c.key)}
                    className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-cream/80 hover:border-coral hover:text-coral transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive OpenStreetMap Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Interactive Map View
              </span>
              <span>Latitude: {destCoords.lat.toFixed(4)}, Longitude: {destCoords.lng.toFixed(4)}</span>
            </div>
            <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-border bg-ink">
              <iframe
                title="Event Venue Location Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 text-[10px] text-cream/70 backdrop-blur-sm">
                Map data © OpenStreetMap contributors
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-surface-2 px-6 py-4">
          <div className="text-xs text-muted">
            Opens turn-by-turn navigation in Google Maps
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-border px-4 py-2 text-xs font-semibold text-cream hover:bg-surface transition-colors"
            >
              Close
            </button>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2 text-xs font-bold text-ink shadow-lg transition-transform hover:scale-[1.02]"
            >
              <Navigation className="h-4 w-4" />
              <span>Open in Google Maps &amp; Directions</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
