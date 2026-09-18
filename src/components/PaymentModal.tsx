import React, { useState, useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, QrCode, Smartphone, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import type { EventRecord } from "../types";
import QRCode from "qrcode";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  event: EventRecord;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  isTeam: boolean;
}

type PaymentMethod = "upi_apps" | "upi_qr" | "card";

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
  attendeeName,
  attendeeEmail = "",
  attendeePhone = "",
  isTeam,
}) => {
  const [method, setMethod] = useState<PaymentMethod>("upi_apps");
  const [selectedApp, setSelectedApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);

  // Demo-only QR: intentionally NOT a upi://pay deep link, so scanning it can
  // never trigger a real transfer — Feastify has no connected payment gateway.
  useEffect(() => {
    if (!isOpen) return;
    const demoString = `FEASTIFY DEMO CHECKOUT — no real payment · ${event.title.slice(0, 40)} · Rs.${event.fee}`;
    QRCode.toDataURL(demoString, { width: 220, margin: 1, color: { dark: "#120d18", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [isOpen, event]);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    // Simulated demo delay — no real payment gateway is connected
    setTimeout(() => {
      const generatedTxnId = `pay_fst_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString().slice(-4)}`;
      setProcessing(false);
      setPaid(true);
      setTimeout(() => {
        onSuccess(generatedTxnId);
      }, 900);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs font-semibold text-cream">Feastify Demo Checkout</p>
              <p className="text-[10px] text-muted">Simulated payment — no real money moves</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1 text-muted hover:bg-surface hover:text-cream transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {paid ? (
          <div className="flex flex-col items-center p-8 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-cream">Registration Confirmed!</h3>
            <p className="mt-1 text-sm text-muted">
              Demo checkout complete — no real payment was made. Generating your ticket...
            </p>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-3.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-center text-[11px] font-medium text-amber-300">
              Demo mode: no payment gateway is connected. This won't charge you or move any real money.
            </div>
            {/* Event Summary Card */}
            <div className="rounded-xl border border-border/70 bg-ink/50 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-display font-semibold text-cream leading-snug">{event.title}</h4>
                  <p className="text-xs text-muted mt-0.5">
                    {isTeam ? "Team Entry Pass" : "Solo Entry Pass"} · {event.club_name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-coral">₹{event.fee}</span>
                  <p className="text-[10px] text-success font-medium">Zero Convenience Fee</p>
                </div>
              </div>
              <div className="mt-2.5 border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted">
                <span>Attendee: {attendeeName}</span>
                <span>{attendeePhone || attendeeEmail || "Verified Student"}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="mt-4 flex rounded-xl border border-border bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setMethod("upi_apps")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  method === "upi_apps" ? "bg-coral text-ink font-semibold" : "text-muted hover:text-cream"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> UPI Apps
              </button>
              <button
                type="button"
                onClick={() => setMethod("upi_qr")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  method === "upi_qr" ? "bg-coral text-ink font-semibold" : "text-muted hover:text-cream"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" /> Scan QR
              </button>
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  method === "card" ? "bg-coral text-ink font-semibold" : "text-muted hover:text-cream"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" /> Card / Net
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4">
              {method === "upi_apps" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "gpay", label: "Google Pay", color: "border-blue-500/40" },
                      { id: "phonepe", label: "PhonePe", color: "border-purple-500/40" },
                      { id: "paytm", label: "Paytm", color: "border-sky-500/40" },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app.id)}
                        className={`rounded-xl border p-2 text-center text-xs font-medium transition-all ${
                          selectedApp === app.id
                            ? "border-coral bg-coral/15 text-coral-light font-semibold"
                            : "border-border bg-surface-2 text-cream/80 hover:border-coral/40"
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Or enter UPI ID / VPA</label>
                    <input
                      type="text"
                      placeholder="e.g. username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {method === "upi_qr" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-ink/70 p-4 text-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Demo QR code" className="h-44 w-44 rounded-lg shadow-md opacity-90" />
                  ) : (
                    <div className="h-44 w-44 flex items-center justify-center text-xs text-muted">
                      Generating QR...
                    </div>
                  )}
                  <p className="mt-2 text-xs font-semibold text-cream">Demo QR — not a real payment link</p>
                  <p className="text-[10px] text-muted mt-0.5">Scanning this will not charge you or transfer any money</p>
                </div>
              )}

              {method === "card" && (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Card Number (0000 0000 0000 0000)"
                    defaultValue="4532 8901 2345 6789"
                    className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM / YY"
                      defaultValue="08/28"
                      className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="782"
                      className="w-full rounded-xl border border-border bg-ink px-3 py-2 text-xs text-cream placeholder:text-muted focus:border-coral focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted text-center">Demo card fields — nothing is submitted or charged</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 text-sm font-bold text-ink shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing (Demo)...
                  </>
                ) : (
                  <>
                    Simulate Payment of ₹{event.fee} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-muted">
                Demo checkout only — no real charge is made
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
