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
        setGmtOffset((prev) => prev + 1);
        flashOffset();
      }
      if (e.key === "ArrowLeft") {
        setGmtOffset((prev) => prev - 1);
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

  // 🌙 Moon phase
  function getMoonPhaseAngle(date: Date) {
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const daysSince =
      (date.getTime() - knownNewMoon.getTime()) /
      (1000 * 60 * 60 * 24);

    const phase = ((daysSince % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
    return (phase / LUNAR_CYCLE) * Math.PI * 2;
  }

  // 🌌 Sidereal time (Greenwich Mean Sidereal Time)
  function getSiderealAngle(date: Date) {
    const JD =
      date.getTime() / 86400000 + 2440587.5;

    const D = JD - 2451545.0;

    let GMST =
      280.46061837 +
      360.98564736629 * D;

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

    const center = size / 2;
    const radius = size * 0.45;

    function drawHand(
      angle: number,
      length: number,
      width: number,
      color: string
    ) {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }

    function drawMoonPhase(date: Date) {
      const r = radius * 0.22;
      const y = center + radius * 0.55;

      ctx.beginPath();
      ctx.arc(center, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#0b1d3a";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();

      const angle = getMoonPhaseAngle(date);

      ctx.save();
      ctx.translate(center, y);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.arc(0, -r * 0.6, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.fill();

      ctx.strokeStyle = "#8b7500";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -r * 0.6, r * 0.25, 0, Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    function drawSidereal(date: Date) {
      const r = radius * 0.22;
      const x = center - radius * 0.55;
      const y = center;

      // Subdial
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#f0efe8";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 24h markers
      for (let i = 0; i < 24; i += 6) {
        const a = (i * Math.PI) / 12 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(
          x + Math.cos(a) * r * 0.8,
          y + Math.sin(a) * r * 0.8
        );
        ctx.lineTo(
          x + Math.cos(a) * r * 0.95,
          y + Math.sin(a) * r * 0.95
        );
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Hand
      const angle = getSiderealAngle(date);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.7, 0);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Label
      ctx.fillStyle = "#444";
      ctx.font = "10px serif";
      ctx.textAlign = "center";
      ctx.fillText("SIDEREAL", x, y + r + 14);
    }

    function drawWatch() {
      ctx.clearRect(0, 0, size, size);

      // Dial
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Hour markers
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(
          center + Math.cos(angle) * radius * 0.85,
          center + Math.sin(angle) * radius * 0.85
        );
        ctx.lineTo(
          center + Math.cos(angle) * radius * 0.95,
          center + Math.sin(angle) * radius * 0.95
        );
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      const now = new Date();
      const seconds =
        now.getSeconds() + now.getMilliseconds() / 1000;
      const minutes = now.getMinutes() + seconds / 60;
      const hours = (now.getHours() % 12) + minutes / 60;
      const gmtHours =
        (now.getHours() + gmtOffset + minutes / 60) % 24;

      drawMoonPhase(now);
      drawSidereal(now);

      drawHand((hours * Math.PI) / 6, radius * 0.5, 8, "#111");
      drawHand((minutes * Math.PI) / 30, radius * 0.7, 5, "#111");
      drawHand(
        (gmtHours * Math.PI) / 12,
        radius * 0.65,
        4,
        "#1f3a5f"
      );
      drawHand(
        (seconds * Math.PI) / 30,
        radius * 0.75,
        2,
        "#b00020"
      );

      ctx.beginPath();
      ctx.arc(center, center, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
    }

    let animationId: number;
    const animate = () => {
      drawWatch();
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [gmtOffset]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-900">
      <canvas ref={canvasRef} className="rounded-full shadow-2xl" />

      {showOffset && (
        <div className="absolute bottom-10 text-sm text-neutral-300 tracking-wide">
          GMT: UTC{gmtOffset >= 0 ? "+" : ""}
          {gmtOffset}
        </div>
      )}
    </main>
  );
}
