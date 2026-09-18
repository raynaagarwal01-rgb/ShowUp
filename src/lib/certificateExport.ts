import QRCode from "qrcode";
import type { EventRecord } from "../types";
import { formatDateRange } from "./format";

export interface CertificateParams {
  event: EventRecord;
  attendeeName: string;
  attendeeCollege?: string;
  registrationId?: string;
  checkedInAt?: string;
  isPreview?: boolean;
}

export async function drawCertificateCanvas(
  params: CertificateParams
): Promise<HTMLCanvasElement> {
  const {
    event,
    attendeeName,
    attendeeCollege = "",
    registrationId = "SAMPLE-2026",
    isPreview = false,
  } = params;

  const width = 1920;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // 1. Deep Midnight Background with Subtle Radial Glow
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    100,
    width / 2,
    height / 2,
    width * 0.75
  );
  bgGrad.addColorStop(0, "#0d1527");
  bgGrad.addColorStop(0.6, "#070b14");
  bgGrad.addColorStop(1, "#04070d");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Dual Luxury Gold Border with Ornate Corners
  const pad = 44;
  ctx.strokeStyle = "#d97706"; // Rich amber gold
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  const innerPad = 58;
  ctx.strokeStyle = "rgba(245, 158, 11, 0.45)"; // Soft gold accent
  ctx.lineWidth = 1.5;
  ctx.strokeRect(innerPad, innerPad, width - innerPad * 2, height - innerPad * 2);

  // Corner Bracket Accents
  const drawCorner = (x: number, y: number, xDir: number, yDir: number) => {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + yDir * 32);
    ctx.lineTo(x, y);
    ctx.lineTo(x + xDir * 32, y);
    ctx.stroke();

    // Small corner diamond
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(x + xDir * 12, y + yDir * 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(innerPad + 8, innerPad + 8, 1, 1);
  drawCorner(width - innerPad - 8, innerPad + 8, -1, 1);
  drawCorner(innerPad + 8, height - innerPad - 8, 1, -1);
  drawCorner(width - innerPad - 8, height - innerPad - 8, -1, -1);

  // 3. Header Branding
  ctx.textAlign = "center";
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("★   SHOWUP OFFICIAL CREDENTIAL SYSTEM   ★", width / 2, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px serif";
  ctx.fillText("CERTIFICATE OF PARTICIPATION", width / 2, 195);

  // Horizontal Accent Divider with Center Diamond
  const divY = 225;
  ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 280, divY);
  ctx.lineTo(width / 2 - 20, divY);
  ctx.moveTo(width / 2 + 20, divY);
  ctx.lineTo(width / 2 + 280, divY);
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(width / 2, divY, 5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Recipient Announcement
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 20px sans-serif";
  ctx.fillText("THIS RECOGNITION IS PROUDLY CONFERRED UPON", width / 2, 290);

  // Recipient Name
  ctx.fillStyle = "#38bdf8"; // Vibrant sky cyan
  ctx.font = "bold 56px sans-serif";
  const nameToDraw = (attendeeName || "Distinguished Participant").trim();
  ctx.fillText(nameToDraw, width / 2, 365);

  // Name Underline Glow
  const nameWidth = Math.min(ctx.measureText(nameToDraw).width + 80, 700);
  const nameGrad = ctx.createLinearGradient(
    width / 2 - nameWidth / 2,
    0,
    width / 2 + nameWidth / 2,
    0
  );
  nameGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
  nameGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.8)");
  nameGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.strokeStyle = nameGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameWidth / 2, 385);
  ctx.lineTo(width / 2 + nameWidth / 2, 385);
  ctx.stroke();

  // Recipient College / Institution
  const collegeName = attendeeCollege || event.college || "VIT Vellore";
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "italic 22px serif";
  ctx.fillText(`representing ${collegeName}`, width / 2, 430);

  // 5. Body Citation
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 21px sans-serif";
  ctx.fillText(
    "in recognition of valuable contribution and spirited participation in",
    width / 2,
    490
  );

  // Event Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px sans-serif";
  const displayTitle =
    event.title.length > 55 ? `${event.title.slice(0, 52)}...` : event.title;
  ctx.fillText(displayTitle, width / 2, 555);

  // Organization & Date Line
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 20px sans-serif";
  const orgLine = `Organized by ${event.club_name} · ${event.college}`;
  ctx.fillText(orgLine, width / 2, 605);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "600 19px sans-serif";
  ctx.fillText(
    `Held on ${formatDateRange(event.start_at, event.end_at)}`,
    width / 2,
    645
  );

  // 6. Footer Area (Separation Line)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(innerPad + 40, 750);
  ctx.lineTo(width - innerPad - 40, 750);
  ctx.stroke();

  // 6A. Left: Credential Metadata
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("CREDENTIAL IDENTIFIER", innerPad + 60, 800);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "600 18px monospace";
  const displayRegId = `FST-${(registrationId || "SAMPLE").slice(0, 12).toUpperCase()}`;
  ctx.fillText(displayRegId, innerPad + 60, 830);

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("STATUS & VERIFICATION", innerPad + 60, 875);

  ctx.fillStyle = isPreview ? "#fbbf24" : "#10b981";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(
    isPreview ? "● PREVIEW (UNLOCKS ON CHECK-IN)" : "✔ VERIFIED ATTENDANCE",
    innerPad + 60,
    905
  );

  ctx.fillStyle = "#64748b";
  ctx.font = "14px sans-serif";
  const dateIssued = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  ctx.fillText(`Issued: ${dateIssued} · Immutable Record`, innerPad + 60, 935);

  // 6B. Center: Gold Foil ShowUp Seal
  const sealX = width / 2;
  const sealY = 880;

  // Outer radial seal shadow/glow
  const sealGlow = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, 70);
  sealGlow.addColorStop(0, "rgba(245, 158, 11, 0.35)");
  sealGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = sealGlow;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 70, 0, Math.PI * 2);
  ctx.fill();

  // Seal Body
  ctx.fillStyle = "#1e1302";
  ctx.beginPath();
  ctx.arc(sealX, sealY, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Seal Text
  ctx.textAlign = "center";
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("SHOWUP", sealX, sealY - 14);
  ctx.font = "bold 10px sans-serif";
  ctx.fillText("★ OFFICIAL ★", sealX, sealY + 2);
  ctx.fillText("SEAL OF MERIT", sealX, sealY + 18);

  // Ribbon tails below seal
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.moveTo(sealX - 24, sealY + 45);
  ctx.lineTo(sealX - 38, sealY + 80);
  ctx.lineTo(sealX - 20, sealY + 70);
  ctx.lineTo(sealX - 4, sealY + 50);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sealX + 24, sealY + 45);
  ctx.lineTo(sealX + 38, sealY + 80);
  ctx.lineTo(sealX + 20, sealY + 70);
  ctx.lineTo(sealX + 4, sealY + 50);
  ctx.closePath();
  ctx.fill();

  // 6C. Right: QR Code & Signature Line
  const qrSize = 130;
  const qrX = width - innerPad - 60 - qrSize;
  const qrY = 785;

  try {
    const verifyUrl = `${window.location.origin}/events/${event.id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: qrSize,
      color: {
        dark: "#0b1220",
        light: "#ffffff",
      },
    });

    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });

    // White rounded card behind QR
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // If QR code fails to render, draw placeholder frame
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
  }

  // Text below QR
  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px sans-serif";
  ctx.fillText("Scan to Verify Credential", qrX + qrSize / 2, qrY + qrSize + 22);

  // Signature Block
  const sigX = qrX - 160;
  const sigY = 885;
  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX - 100, sigY);
  ctx.lineTo(sigX + 100, sigY);
  ctx.stroke();

  // Faux elegant handwritten signature
  ctx.fillStyle = "#fde68a";
  ctx.font = "italic 26px serif";
  ctx.fillText("ShowUp Committee", sigX, sigY - 12);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px sans-serif";
  ctx.fillText("AUTHORIZED CONVENOR", sigX, sigY + 22);

  // 7. Watermark for Preview Mode
  if (isPreview) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(239, 68, 68, 0.14)";
    ctx.font = "bold 90px sans-serif";
    ctx.fillText("PREVIEW · ATTEND EVENT TO UNLOCK", 0, 0);
    ctx.restore();
  }

  return canvas;
}

export async function generateCertificateDataUrl(
  params: CertificateParams
): Promise<string> {
  const canvas = await drawCertificateCanvas(params);
  return canvas.toDataURL("image/png");
}

export async function downloadCertificateImage(
  params: CertificateParams
): Promise<void> {
  const canvas = await drawCertificateCanvas(params);
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const cleanTitle = (params.event.title || "event")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  const cleanName = (params.attendeeName || "participant")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  link.download = `showup-certificate-${cleanTitle}-${cleanName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
