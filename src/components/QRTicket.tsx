import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

export const QRTicket: React.FC<{ value: string; size?: number }> = ({ value, size = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#140f1a", light: "#fbf3ea" },
    }).catch(() => {
      // rendering failure just leaves a blank canvas; not worth surfacing to the participant
    });
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};
