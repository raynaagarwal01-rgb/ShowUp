import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { checkIn, getEvent, listEventRegistrants } from "../../lib/db";
import type { EventRecord, RegistrantView } from "../../types";

type Feedback = { kind: "success" | "error"; message: string } | null;

export const CheckInPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualId, setManualId] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    getEvent(id).then(setEvent);
  }, [id]);

  const handleResult = async (registrationId: string) => {
    if (!id || busyRef.current) return;
    busyRef.current = true;
    try {
      const registrants: RegistrantView[] = await listEventRegistrants(id);
      const match = registrants.find((r) => r.id === registrationId.trim());
      if (!match) {
        setFeedback({ kind: "error", message: "That ticket doesn't belong to this event." });
      } else if (match.status === "cancelled") {
        setFeedback({ kind: "error", message: `${match.profile.name}'s registration was cancelled.` });
      } else if (match.checked_in_at) {
        setFeedback({ kind: "error", message: `${match.profile.name} is already checked in.` });
      } else {
        await checkIn(match.id);
        setFeedback({ kind: "success", message: `${match.profile.name} checked in ✓` });
      }
    } catch {
      setFeedback({ kind: "error", message: "Couldn't read that ticket." });
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 1200);
    }
  };

  useEffect(() => {
    const containerId = "showup-qr-reader";
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    let cancelled = false;
    let runningScanner: Html5Qrcode | null = null;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleResult(decodedText),
        () => {
          // per-frame "no QR found" callback — expected on almost every frame, nothing to surface
        },
      )
      .then(() => {
        if (cancelled) {
          // effect already cleaned up (e.g. React StrictMode's double-invoke, or a fast
          // navigation away) before the camera finished starting — stop it right away
          // instead of leaving a stray camera stream running.
          scanner.stop().then(() => scanner.clear()).catch(() => {});
          return;
        }
        runningScanner = scanner;
        setScannerReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCameraError("Couldn't access a camera. You can still check people in manually below.");
        }
      });

    return () => {
      cancelled = true;
      // html5-qrcode throws synchronously (not a rejected promise) when stop() is called
      // on a scanner that never finished starting, so only stop one we know is running.
      if (runningScanner) {
        runningScanner.stop().then(() => runningScanner!.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) handleResult(manualId.trim());
    setManualId("");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <Link to="/organizer" className="flex items-center gap-1.5 text-sm text-muted hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold">
        Check-in{event ? ` · ${event.title}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted">Point the camera at a participant's QR ticket.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div id="showup-qr-reader" className="w-full" />
        {!scannerReady && !cameraError && (
          <p className="p-4 text-center text-xs text-muted">Starting camera...</p>
        )}
        {cameraError && <p className="p-4 text-center text-xs text-warning">{cameraError}</p>}
      </div>

      {feedback && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-cream/70">
          <KeyRound className="h-3.5 w-3.5" /> No camera? Paste the ticket ID instead
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="reg_..."
            className="flex-1 rounded-lg border border-border bg-ink px-3 py-2 text-sm focus:border-coral focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-ink">
            Check in
          </button>
        </div>
      </form>
    </div>
  );
};
