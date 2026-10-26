import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export const QRTicket: React.FC<{ value: string; size?: number }> = ({ value, size = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!canvasRef.current) return;
    canvasRef.current.getContext("2d")?.clearRect(0, 0, size, size);
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: "#171717", light: "#ffffff" },
    }).then(() => {
      if (active && canvasRef.current) canvasRef.current.getContext("2d")?.drawImage(canvas, 0, 0);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [value, size]);

  return failed
    ? <p role="status" className="grid place-items-center border border-border p-4 text-center text-xs text-muted" style={{ width: size, minHeight: size }}>QR code unavailable. Registration #{value.replace(/^SHOWUP-REG-/, "")}</p>
    : <canvas ref={canvasRef} width={size} height={size} role="img" aria-label={`QR ticket for registration ${value.replace(/^SHOWUP-REG-/, "")}`} className="rounded-md border border-border" />;
};
