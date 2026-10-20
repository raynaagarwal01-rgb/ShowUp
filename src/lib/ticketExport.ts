import QRCode from "qrcode";
import type { EventRecord } from "../types";
import { bannerHue, formatEventDate, ticketCode } from "./format";

interface ExportTicketParams {
  event: EventRecord;
  registrationId: number;
  attendeeName: string;
  attendeeEmail?: string;
  teamName?: string;
}

export async function downloadTicketImage({
  event,
  registrationId,
  attendeeName,
  attendeeEmail = "",
  teamName = "",
}: ExportTicketParams): Promise<void> {
  const width = 800;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#120d18";
  ctx.fillRect(0, 0, width, height);

  // Top header banner with gradient
  const hue = bannerHue(event);
  const code = ticketCode(registrationId);
  const college = event.organizer_college || "";
  const grad = ctx.createLinearGradient(0, 0, width, 240);
  grad.addColorStop(0, `hsl(${hue}, 75%, 26%)`);
  grad.addColorStop(1, `hsl(${hue}, 70%, 14%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 240);

  // Top header branding
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("SHOWUP", 40, 50);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("EVENT PASS", width - 140, 50);

  // Category badge
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.roundRect(40, 80, 120, 30, 15);
  ctx.fill();
  ctx.fillStyle = "#ff6b47";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(event.category.toUpperCase(), 100, 100);

  // Event Title (Wrap text if needed)
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  const title = event.title;
  if (title.length > 35) {
    ctx.fillText(title.slice(0, 35) + "...", 40, 165);
  } else {
    ctx.fillText(title, 40, 165);
  }

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText([event.organizer_name, college].filter(Boolean).join(" · ").slice(0, 65), 40, 200);

  // Ticket details body
  const bodyY = 270;
  ctx.fillStyle = "#1e1628";
  ctx.beginPath();
  ctx.roundRect(30, bodyY, width - 60, 480, 20);
  ctx.fill();
  ctx.strokeStyle = "#38294a";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw attendee & schedule details
  ctx.fillStyle = "#a89fb3";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("ATTENDEE", 60, bodyY + 45);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(attendeeName || "Participant", 60, bodyY + 75);

  ctx.fillStyle = "#a89fb3";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("CONTACT", 420, bodyY + 45);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px sans-serif";
  ctx.fillText((attendeeEmail || "Participant").slice(0, 32), 420, bodyY + 73);

  // Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.moveTo(60, bodyY + 110);
  ctx.lineTo(width - 60, bodyY + 110);
  ctx.stroke();

  // Schedule
  ctx.fillStyle = "#a89fb3";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("DATE & TIME", 60, bodyY + 145);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(formatEventDate(event.event_date), 60, bodyY + 175);

  // Venue
  ctx.fillStyle = "#a89fb3";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("VENUE", 60, bodyY + 225);
  ctx.fillStyle = "#ffffff";
  ctx.font = "16px sans-serif";
  ctx.fillText(event.venue.slice(0, 60), 60, bodyY + 252);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(college.slice(0, 60), 60, bodyY + 278);

  // Team info if present
  if (teamName) {
    ctx.fillStyle = "#a89fb3";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("TEAM", 60, bodyY + 330);
    ctx.fillStyle = "#ff6b47";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(teamName, 60, bodyY + 358);
  }

  // Registration ID
  ctx.fillStyle = "#a89fb3";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("TICKET PASS ID", 420, bodyY + 145);
  ctx.fillStyle = "#ff6b47";
  ctx.font = "bold 16px monospace";
  ctx.fillText(code, 420, bodyY + 175);

  // QR Code container
  const qrBoxY = 780;
  ctx.fillStyle = "#1e1628";
  ctx.beginPath();
  ctx.roundRect(30, qrBoxY, width - 60, 240, 20);
  ctx.fill();
  ctx.strokeStyle = "#38294a";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Render high-res QR code
  try {
    const qrDataUrl = await QRCode.toDataURL(code, {
      width: 180,
      margin: 1,
      color: { dark: "#120d18", light: "#ffffff" },
    });
    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.src = qrDataUrl;
    });

    // Draw QR centered on the left inside the box
    ctx.drawImage(qrImg, 60, qrBoxY + 30, 180, 180);

    // QR instructions on right
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("SCAN AT VENUE CHECK-IN", 270, qrBoxY + 70);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Present this QR code to organizers at the entrance.", 270, qrBoxY + 105);
    ctx.fillText("Carry your college ID card.", 270, qrBoxY + 130);

    ctx.fillStyle = "#ff6b47";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`Ticket ${code}`, 270, qrBoxY + 175);
  } catch (err) {
    console.error("Failed to generate QR on ticket canvas:", err);
  }

  // Footer text
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ShowUp · Built for college events and competitions across India", width / 2, height - 20);

  // Trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `showup-ticket-${event.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}
