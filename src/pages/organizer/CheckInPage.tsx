import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, CheckCircle2, KeyRound, XCircle } from "lucide-react";
import { checkIn, getEvent } from "../../lib/api";
import type { EventRecord } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { parseTicketCode } from "../../lib/format";

type Feedback = { kind: "success" | "error"; message: string } | null;

export const CheckInPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id;
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [manualId, setManualId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await getEvent(id);
      if (!loaded) throw new Error("Event not found.");
      if (loaded.organizer_id !== userId) throw new Error("You can only check in attendees for your own events.");
      setEvent(loaded);
    } catch (err) {
      setEvent(null);
      setLoadError(err instanceof Error ? err.message : "Couldn't load this event.");
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => { void loadEvent(); }, [loadEvent]);

  const handleResult = useCallback(async (scanned: string): Promise<boolean> => {
    if (!id || busyRef.current) return false;
    busyRef.current = true;
    setProcessing(true);
    try {
      const registrationId = parseTicketCode(scanned);
      if (!registrationId) throw new Error("That isn't a ShowUp ticket.");
      const { name } = await checkIn(registrationId, Number(id));
      setFeedback({ kind: "success", message: `${name} checked in.` });
      return true;
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Couldn't read that ticket." });
      return false;
    } finally {
      window.setTimeout(() => {
        busyRef.current = false;
        setProcessing(false);
      }, 900);
    }
  }, [id]);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    let running: Html5Qrcode | null = null;
    let scanner: Html5Qrcode;
    try {
      scanner = new Html5Qrcode("showup-qr-reader");
    } catch {
      setCameraError("Couldn't start the camera. Use manual check-in below.");
      return;
    }
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (value) => { void handleResult(value); },
      () => {},
    ).then(() => {
      if (cancelled) {
        void scanner.stop().then(() => scanner.clear()).catch(() => {});
      } else {
        running = scanner;
        setScannerReady(true);
      }
    }).catch(() => {
      if (!cancelled) setCameraError("Couldn't access a camera. Use manual check-in below.");
    });
    return () => {
      cancelled = true;
      if (running) void running.stop().then(() => running?.clear()).catch(() => {});
    };
  }, [event, handleResult]);

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (await handleResult(manualId.trim())) setManualId("");
  };

  return <main className="page-shell max-w-2xl space-y-6 py-10 sm:py-14">
    <Link to="/organizer" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#171717]"><ArrowLeft size={16} aria-hidden="true" />Your events</Link>
    <header><p className="eyebrow">Attendance</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Check-in</h1><p className="mt-2 text-sm text-muted">Scan a ticket or enter its code to mark a registration as checked in.</p></header>

    {loading ? <p role="status" className="panel p-5 text-sm text-muted">Loading event…</p> : loadError ? <div role="alert" className="panel p-5 text-sm text-red-700">{loadError}<div className="mt-4 flex gap-2"><button className="btn-secondary" onClick={() => void loadEvent()}>Try again</button><Link className="btn-secondary" to="/organizer">Your events</Link></div></div> : <>
      <section className="panel space-y-3 p-4 sm:p-5" aria-label="QR ticket scanner">
        <div><h2 className="font-semibold">{event?.title}</h2><p className="mt-1 text-sm text-muted">Point the camera at a participant’s QR ticket.</p></div>
        <div className="overflow-hidden rounded-md border border-border bg-[#fafafa]">
          <div id="showup-qr-reader" className="min-h-16 w-full" />
          {!scannerReady && !cameraError && <p role="status" className="p-4 text-center text-sm text-muted">Starting camera…</p>}
          {cameraError && <p role="status" className="p-4 text-center text-sm text-muted">{cameraError}</p>}
        </div>
      </section>

      {feedback && <div role={feedback.kind === "error" ? "alert" : "status"} aria-live="polite" className={`flex items-center gap-2 rounded-md border p-3 text-sm ${feedback.kind === "success" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-red-200 bg-red-50 text-red-800"}`}>
        {feedback.kind === "success" ? <CheckCircle2 size={17} aria-hidden="true" /> : <XCircle size={17} aria-hidden="true" />}{feedback.message}
      </div>}

      <form onSubmit={(e) => void handleManualSubmit(e)} className="panel space-y-3 p-4 sm:p-5">
        <label htmlFor="ticket-code" className="flex items-center gap-2 text-sm font-medium"><KeyRound size={16} aria-hidden="true" />Enter ticket code manually</label>
        <div className="flex flex-col gap-2 sm:flex-row"><input id="ticket-code" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="e.g. 42 or SHOWUP-REG-42" className="field min-w-0 flex-1" /><button type="submit" disabled={processing || !manualId.trim()} className="btn-primary">{processing ? "Checking…" : "Check in"}</button></div>
      </form>
    </>}
  </main>;
};
