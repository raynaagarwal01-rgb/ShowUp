import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, Printer, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import type { EventRecord } from "../types";
import { formatDateRange } from "../lib/format";

interface ODLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRecord;
  attendeeName: string;
  registrationNumber?: string;
  department?: string;
  academicYear?: string;
  collegeName?: string;
  registrationId?: string;
  checkedIn?: boolean;
}

export const ODLetterModal: React.FC<ODLetterModalProps> = ({
  isOpen,
  onClose,
  event,
  attendeeName,
  registrationNumber = "25BCE0703",
  department = "Computer Science & Engineering",
  academicYear = "2nd Year / B.Tech",
  collegeName = "Vellore Institute of Technology (VIT), Vellore",
  registrationId = "REG-2026-OD",
  checkedIn = false,
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const verifyUrl = `${window.location.origin}/events/${event.id}?verify=${registrationId}`;
    QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
      .then(setQrUrl)
      .catch((err) => console.error("QR render error", err));
  }, [isOpen, event.id, registrationId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const odRefId = `OD-VIT-2026-${(registrationId || "SAMPLE").slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        {/* Modal Top Toolbar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-coral/10 p-1.5 text-coral">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-cream">
                Official Student On-Duty (OD) Attendance Letter
              </h2>
              <p className="text-[11px] text-muted">
                Authorized academic document for HOD &amp; Proctor submission
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-coral px-3.5 py-1.5 text-xs font-bold text-ink shadow hover:opacity-90 transition-opacity"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* The Printable A4 University Letter */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-800 font-serif leading-relaxed print:p-8 print:overflow-visible">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1">
            <div className="text-[12px] font-sans font-extrabold uppercase tracking-widest text-slate-600">
              VELLORE INSTITUTE OF TECHNOLOGY
            </div>
            <h1 className="text-2xl font-sans font-black tracking-tight text-slate-900">
              OFFICE OF STUDENT WELFARE &amp; ACADEMIC AFFAIRS
            </h1>
            <p className="text-xs font-sans text-slate-600">
              Vellore Campus · Tiruvalam Road, Katpadi, Vellore, Tamil Nadu 632014
            </p>
            <div className="pt-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 flex justify-between px-2">
              <span>REF NO: <strong>{odRefId}</strong></span>
              <span>DATE: <strong>{todayStr}</strong></span>
            </div>
          </div>

          {/* Letter Title */}
          <div className="my-6 text-center">
            <span className="inline-block border-y border-slate-900 py-1.5 px-6 font-sans text-sm font-bold uppercase tracking-wide text-slate-900 bg-slate-50">
              ON-DUTY (OD) ATTENDANCE REQUISITION &amp; CERTIFICATION SLIP
            </span>
          </div>

          {/* Body Salutation */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-800">
            <p className="font-sans font-semibold text-slate-900">
              TO: THE PROCTOR / HEAD OF DEPARTMENT / COURSE FACULTY
            </p>

            <p>
              This is to officially certify that the student whose particulars are listed below is a registered participant / attendee representing their institution in the official collegiate festival / technical event coordinated under the auspices of the Student Welfare Office.
            </p>

            {/* Student & Event Particulars Table */}
            <div className="rounded border border-slate-300 overflow-hidden my-4">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-600 w-1/3">Student Full Name:</td>
                    <td className="p-2.5 font-semibold text-slate-900">{attendeeName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-600">Registration / Roll No:</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{registrationNumber}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-600">Department &amp; Program:</td>
                    <td className="p-2.5 text-slate-900">{department} ({academicYear})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-600">College / Institution:</td>
                    <td className="p-2.5 text-slate-900">{collegeName}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-600">Event / Competition:</td>
                    <td className="p-2.5 font-bold text-slate-900">{event.title}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold text-slate-600">Organizing Club / Chapter:</td>
                    <td className="p-2.5 text-slate-900">{event.club_name}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-600">Duration &amp; Dates:</td>
                    <td className="p-2.5 text-slate-900">{formatDateRange(event.start_at, event.end_at)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-600">Campus Venue:</td>
                    <td className="p-2.5 text-slate-900">{event.venue}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attendance Status Banner */}
            <div className={`p-3 rounded border font-sans text-xs flex items-center justify-between ${
              checkedIn
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-amber-50 border-amber-300 text-amber-900"
            }`}>
              <div className="flex items-center gap-2">
                {checkedIn ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                )}
                <span>
                  <strong>ATTENDANCE VERIFICATION:</strong>{" "}
                  {checkedIn
                    ? "Verified & Checked In by Venue Gate Staff"
                    : "Official Registration Confirmed · Pending Venue Check-in"}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold">FEASTIFY CERTIFIED</span>
            </div>

            <p className="text-xs text-slate-700 italic">
              In accordance with academic regulations governing curricular co-curricular activities, the student is hereby recommended for On-Duty (OD) leave exemption for classes/labs scheduled during the aforementioned event hours.
            </p>
          </div>

          {/* Verification Signatures & QR Section */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 flex items-end justify-between font-sans">
            {/* Verification QR */}
            <div className="flex items-center gap-3">
              {qrUrl ? (
                <img src={qrUrl} alt="OD QR Code" className="h-20 w-20 border border-slate-300 p-1" />
              ) : (
                <div className="h-20 w-20 bg-slate-100 border border-slate-300" />
              )}
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div className="font-bold text-slate-800 uppercase">Cryptographic QR Verification</div>
                <div>Scan to authenticate this OD record on Feastify.</div>
                <div className="font-mono text-slate-600">ID: {odRefId}</div>
              </div>
            </div>

            {/* Authorized Signatories */}
            <div className="flex gap-10 text-center">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 w-32 flex items-end justify-center font-serif italic text-slate-800 text-sm">
                  Dr. K. Ramanathan
                </div>
                <div className="text-[10px] font-bold text-slate-700 uppercase">
                  Faculty Coordinator
                </div>
                <div className="text-[9px] text-slate-500">Student Welfare Office</div>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b border-slate-400 w-32 flex items-end justify-center font-serif italic text-slate-800 text-sm">
                  Convenor, graVITas
                </div>
                <div className="text-[10px] font-bold text-slate-700 uppercase">
                  Festival Director
                </div>
                <div className="text-[9px] text-slate-500">VIT Vellore</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 px-6 py-3 print:hidden text-xs text-muted">
          <span>Official university On-Duty format compliant with VIT attendance guidelines.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-1 text-cream hover:bg-surface-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
