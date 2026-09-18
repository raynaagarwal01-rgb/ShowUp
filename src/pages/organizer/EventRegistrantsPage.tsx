import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, QrCode } from "lucide-react";
import { getEvent, listEventRegistrants } from "../../lib/db";
import type { EventRecord, RegistrantView } from "../../types";
import { StatusPill, registrationTone } from "../../components/StatusPill";

function downloadCsv(filename: string, rows: RegistrantView[]) {
  const header = ["Name", "Email", "Status", "Team", "Checked in"];
  const lines = rows.map((r) =>
    [
      r.profile.name,
      r.profile.email,
      r.status,
      r.team?.name ?? "",
      r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const EventRegistrantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [registrants, setRegistrants] = useState<RegistrantView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getEvent(id), listEventRegistrants(id)]).then(([ev, regs]) => {
      setEvent(ev);
      setRegistrants(regs);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="px-6 py-16 text-center text-muted">Loading...</div>;
  if (!event) return <div className="px-6 py-16 text-center text-cream/80">Event not found.</div>;

  const confirmed = registrants.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrants.filter((r) => r.status === "waitlisted").length;
  const checkedIn = registrants.filter((r) => r.checked_in_at).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/organizer" className="flex items-center gap-1.5 text-sm text-muted hover:text-cream">
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{event.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {confirmed} confirmed · {waitlisted} waitlisted · {checkedIn} checked in
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/organizer/events/${event.id}/checkin`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-cream/80 hover:border-coral/50"
          >
            <QrCode className="h-4 w-4" /> Check-in scanner
          </Link>
          <button
            onClick={() => downloadCsv(`${event.title}-registrants.csv`, registrants)}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-3.5 py-2 text-sm font-semibold text-ink"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {registrants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No one has registered yet.
                </td>
              </tr>
            ) : (
              registrants.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.profile.name}</td>
                  <td className="px-4 py-3 text-muted">{r.profile.email}</td>
                  <td className="px-4 py-3 text-muted">{r.team?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill label={r.status} tone={registrationTone(r.status)} />
                  </td>
                  <td className="px-4 py-3">
                    {r.checked_in_at ? (
                      <StatusPill label="Checked in" tone="success" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
