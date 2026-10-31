"use client";

import { useEffect, useRef } from "react";

function paint(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const styles = getComputedStyle(document.documentElement);
  const shade = styles.getPropertyValue("--color-shade").trim() || "oklch(86% 0.05 212)";
  const light = styles.getPropertyValue("--color-light").trim() || "oklch(99.7% 0.004 95)";
  const spec1 = styles.getPropertyValue("--spec-1").trim() || "oklch(78% 0.15 32)";
  const spec3 = styles.getPropertyValue("--spec-3").trim() || "oklch(82% 0.13 175)";

  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  for (let column = 0; column < 16; column += 1) {
    for (let row = 0; row < 11; row += 1) {
      const x = (column / 15) * width + Math.sin(row * 1.15 + column * 0.4) * 36;
      const y = (row / 10) * height + Math.cos(column * 0.85 + row * 0.5) * 26;
      const radius = 36 + ((column * 11 + row * 7) % 54);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const seam = (column + row) % 9 === 0 ? spec1 : (column + row) % 7 === 0 ? spec3 : light;
      glow.addColorStop(0, seam);
      glow.addColorStop(0.18, light);
      glow.addColorStop(1, shade);
      ctx.globalAlpha = 0.22 + ((column * row) % 5) * 0.04;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.55, radius * 0.48, column * 0.31 + row * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function LightField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const redraw = () => paint(canvas);
    redraw();

    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return <canvas ref={ref} className="light-canvas" aria-hidden="true" />;
}
