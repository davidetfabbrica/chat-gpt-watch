"use client";

import { useEffect, useRef, useState } from "react";

const LUNAR_CYCLE = 29.53059;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gmtOffset, setGmtOffset] = useState(0);
  const [showOffset, setShowOffset] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setGmtOffset((p) => p + 1);
        flashOffset();
      }
      if (e.key === "ArrowLeft") {
        setGmtOffset((p) => p - 1);
        flashOffset();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const flashOffset = () => {
    setShowOffset(true);
    setTimeout(() => setShowOffset(false), 1500);
  };

  function getMoonPhaseAngle(date: Date) {
    const ref = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const days =
      (date.getTime() - ref.getTime()) /
      (1000 * 60 * 60 * 24);
    const phase = ((days % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    return (phase / LUNAR_CYCLE) * Math.PI * 2;
  }

  function getSiderealAngle(date: Date) {
    const JD = date.getTime() / 86400000 + 2440587.5;
    const D = JD - 2451545.0;
    let GMST = 280.46061837 + 360.98564736629 * D;
    GMST = ((GMST % 360) + 360) % 360;
    return (GMST / 360) * Math.PI * 2;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    const c = size / 2;
    const r = size * 0.45;

    function drawSunburstDial() {
      for (let i = 0; i < 360; i++) {
        const a = (i * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(
          c + Math.cos(a) * r,
          c + Math.sin(a) * r
        );
        ctx.strokeStyle = `rgba(255,255,255,0.015)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function drawMinuteTrack() {
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI) / 30 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(
          c + Math.cos(a) * r * 0.96,
          c + Math.sin(a) * r * 0.96
        );
        ctx.lineTo(
          c + Math.cos(a) * r * 0.99,
          c + Math.sin(a) * r * 0.99
        );
        ctx.strokeStyle = "#333";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
      }
    }

    function drawAppliedIndices() {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 - Math.PI / 2;
        const len = i === 0 ? 22 : 16;
        ctx.beginPath();
        ctx.moveTo(
          c + Math.cos(a) * r * 0.82,
          c + Math.sin(a) * r * 0.82
        );
        ctx.lineTo(
          c + Math.cos(a) * r * 0.82 + Math.cos(a) * len,
          c + Math.sin(a) * r * 0.82 + Math.sin(a) * len
        );
        ctx.strokeStyle = "#c9a24d";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function drawHand(angle: number, len: number, w: number, col: string) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }

    function drawMoon(date: Date) {
      const rr = r * 0.22;
      const y = c + r * 0.55;
      ctx.beginPath();
      ctx.arc(c, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = "#0b1d3a";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(c, y);
      ctx.rotate(getMoonPhaseAngle(date));
      ctx.beginPath();
      ctx.arc(0, -rr * 0.6, rr * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.fill();
      ctx.restore();
    }

    function drawSidereal(date: Date) {
      const rr = r * 0.22;
      const x = c - r * 0.55;
      ctx.beginPath();
      ctx.arc(x, c, rr, 0, Math.PI * 2);
      ctx.fillStyle = "#f0efe8";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(x, c);
      ctx.rotate(getSiderealAngle(date) - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rr * 0.7, 0);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    function drawDate(date: Date) {
      const w = r * 0.28;
      const h = r * 0.18;
      const x = c + r * 0.55 - w / 2;
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(x, c - h / 2, w, h);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, c - h / 2, w, h);

      ctx.fillStyle = "#111";
      ctx.font = `${h * 0.75}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(date.getDate().toString(), x + w / 2, c + 1);
    }

    function drawWatch() {
      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.stroke();

      drawSunburstDial();
      drawMinuteTrack();
      drawAppliedIndices();

      ctx.fillStyle = "#333";
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.fillText("ATELIER ASTRONOMIQUE", c, c - r * 0.35);

      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      const g = (now.getHours() + gmtOffset + m / 60) % 24;

      drawMoon(now);
      drawSidereal(now);
      drawDate(now);

      drawHand((h * Math.PI) / 6, r * 0.5, 8, "#111");
      drawHand((m * Math.PI) / 30, r * 0.7, 5, "#111");
      drawHand((g * Math.PI) / 12, r * 0.65, 4, "#1f3a5f");
      drawHand((s * Math.PI) / 30, r * 0.75, 2, "#b00020");

      ctx.beginPath();
      ctx.arc(c, c, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
    }

    let id: number;
    const animate = () => {
      drawWatch();
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, [gmtOffset]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-900">
      <canvas ref={canvasRef} className="rounded-full shadow-2xl" />
      {showOffset && (
        <div className="absolute bottom-10 text-sm text-neutral-300">
          GMT: UTC{gmtOffset >= 0 ? "+" : ""}
          {gmtOffset}
        </div>
      )}
    </main>
  );
}
