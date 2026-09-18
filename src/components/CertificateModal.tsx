import React, { useEffect, useState } from "react";
import { Award, CheckCircle, Download, ShieldCheck, X } from "lucide-react";
import type { EventRecord } from "../types";
import {
  downloadCertificateImage,
  generateCertificateDataUrl,
} from "../lib/certificateExport";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
  attendeeName: string;
  attendeeCollege?: string;
  registrationId?: string;
  checkedIn?: boolean;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  event,
  attendeeName,
  attendeeCollege,
  registrationId,
  checkedIn = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setGenerating(true);

    generateCertificateDataUrl({
      event,
      attendeeName: attendeeName || "Participant",
      attendeeCollege: attendeeCollege || event.college,
      registrationId: registrationId || "SAMPLE-2026",
      isPreview: !checkedIn,
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate certificate preview:", err);
      })
      .finally(() => {
        if (active) setGenerating(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, event, attendeeName, attendeeCollege, registrationId, checkedIn]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificateImage({
        event,
        attendeeName: attendeeName || "Participant",
        attendeeCollege: attendeeCollege || event.college,
        registrationId: registrationId || "SAMPLE-2026",
        isPreview: !checkedIn,
      });
    } catch (e) {
      console.error("Certificate download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-cream">
                Feastify Verified Credential
              </h2>
              <p className="text-xs text-muted">
                Official 1920x1080 High-Resolution Participation Certificate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-cream transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status notice */}
        <div className="border-b border-border bg-surface-2/60 px-6 py-2.5 flex items-center justify-between text-xs">
          {checkedIn ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Verified Attendance: Full Certificate unlocked and authenticated.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Award className="h-4 w-4" />
              Certificate Preview: The official unwatermarked credential unlocks upon event check-in.
            </div>
          )}
          <span className="text-[11px] text-muted hidden sm:inline">
            Credential ID: FST-{(registrationId || "SAMPLE").slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[300px]">
          {generating ? (
            <div className="space-y-3 text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
              <p className="text-xs text-muted">Rendering cryptographic certificate canvas...</p>
            </div>
          ) : dataUrl ? (
            <div className="relative group w-full rounded-xl overflow-hidden border border-border shadow-2xl bg-black">
              <img
                src={dataUrl}
                alt="Certificate of Participation"
                className="w-full h-auto object-contain transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="text-center text-xs text-muted py-8">
              Unable to render certificate. Please try again.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2/40 px-6 py-4">
          <div className="text-xs text-muted flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-coral" />
            Suitable for LinkedIn, portfolios, and academic OD submissions.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-cream transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || generating}
              className="flex items-center gap-2 rounded-xl bg-coral px-5 py-2 text-xs font-bold text-ink hover:opacity-90 disabled:opacity-50 shadow-md shadow-coral/10 transition-all"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Exporting PNG..." : "Download HD Certificate (PNG)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
