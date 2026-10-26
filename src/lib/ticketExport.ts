import QRCode from "qrcode";
import type { EventRecord } from "../types";
import { formatEventDate, ticketCode } from "./format";

interface ExportTicketParams {
  event: EventRecord;
  registrationId: number;
  attendeeName: string;
  attendeeEmail?: string;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const words = text.split(/\s+/).flatMap((word) => {
    if (ctx.measureText(word).width <= maxWidth) return [word];
    const parts: string[] = [];
    let part = "";
    for (const character of word) {
      if (part && ctx.measureText(part + character).width > maxWidth) {
        parts.push(part);
        part = character;
      } else part += character;
    }
    if (part) parts.push(part);
    return parts;
  });
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = visible[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    visible[maxLines - 1] = `${last.trimEnd()}…`;
  }
  visible.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
}

export async function downloadTicketImage({
  event,
  registrationId,
  attendeeName,
  attendeeEmail = "",
}: ExportTicketParams): Promise<void> {
  const width = 800;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const code = ticketCode(registrationId);
  const left = 64;
  const right = width - left;
  const muted = "#737373";
  const ink = "#171717";
  const line = "#e5e5e5";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.fillStyle = ink;
  ctx.font = '600 24px "Geist", "Inter", sans-serif';
  ctx.fillText("SHOWUP", left, 80);
  ctx.textAlign = "right";
  ctx.fillStyle = muted;
  ctx.font = '500 14px "Geist", "Inter", sans-serif';
  ctx.fillText("EVENT PASS", right, 80);
  ctx.textAlign = "left";

  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(left, 112);
  ctx.lineTo(right, 112);
  ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '600 14px "Geist", "Inter", sans-serif';
  ctx.fillText(event.category.toUpperCase(), left, 158);
  ctx.fillStyle = ink;
  ctx.font = '600 38px "Geist", "Inter", sans-serif';
  drawWrappedText(ctx, event.title, left, 214, right - left, 48, 2);
  ctx.fillStyle = muted;
  ctx.font = '400 16px "Geist", "Inter", sans-serif';
  drawWrappedText(ctx, [event.organizer_name, event.organizer_college].filter(Boolean).join(" · "), left, 300, right - left, 23, 2);

  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(left, 356);
  ctx.lineTo(right, 356);
  ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '600 13px "Geist", "Inter", sans-serif';
  ctx.fillText("ATTENDEE", left, 398);
  ctx.fillText("TICKET ID", 430, 398);
  ctx.fillStyle = ink;
  ctx.font = '500 20px "Geist", "Inter", sans-serif';
  drawWrappedText(ctx, attendeeName || "Participant", left, 430, 330, 26, 2);
  ctx.font = '500 18px "SFMono-Regular", Consolas, monospace';
  ctx.fillText(code, 430, 430);

  ctx.fillStyle = muted;
  ctx.font = '600 13px "Geist", "Inter", sans-serif';
  ctx.fillText("CONTACT", left, 500);
  ctx.fillText("DATE & TIME", 430, 500);
  ctx.fillStyle = ink;
  ctx.font = '400 16px "Geist", "Inter", sans-serif';
  drawWrappedText(ctx, attendeeEmail || "—", left, 532, 330, 23, 2);
  drawWrappedText(ctx, formatEventDate(event.event_date), 430, 532, 300, 23, 2);

  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(left, 592);
  ctx.lineTo(right, 592);
  ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '600 13px "Geist", "Inter", sans-serif';
  ctx.fillText("VENUE", left, 634);
  ctx.fillStyle = ink;
  ctx.font = '400 18px "Geist", "Inter", sans-serif';
  drawWrappedText(ctx, event.venue, left, 668, right - left, 25, 3);

  try {
    const qrDataUrl = await QRCode.toDataURL(code, {
      width: 220,
      margin: 1,
      color: { dark: "#171717", light: "#ffffff" },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => reject(new Error("QR image failed to load"));
      qrImg.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, (width - 220) / 2, 750, 220, 220);
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.font = '500 14px "Geist", "Inter", sans-serif';
    ctx.fillText("Present this code at event check-in", width / 2, 1000);
    ctx.textAlign = "left";
  } catch (err) {
    console.error("Failed to generate QR on ticket canvas:", err);
  }

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
