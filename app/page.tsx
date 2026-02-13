"use client";

import { useEffect, useRef, useState } from "react";

const LUNAR_CYCLE = 29.53059;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gmtOffset, setGmtOffset] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setGmtOffset((p) => p + 1);
      if (e.key === "ArrowLeft") setGmtOffset((p) => p - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function getMoonPhaseAngle(date: Date) {
    const ref = new Date(Date.UTC(2000, 0, 6, 18, 14));
    const days = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
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

    const size = 560; // Increased from 520 to fit case and crown
    canvas.width = size;
    canvas.height = size;

    const c = size / 2;
    const r = size * 0.42; // Adjusted proportion for larger canvas

    function drawGuilloche(breathe: number) {
      ctx.save();
      ctx.translate(c, c);
      
      // Create clipping region for the main dial
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.clip();
      
      // Fine barleycorn guilloche: very dense overlapping circles
      const circleRadius = r * 0.018; // Much smaller for fine texture
      const spacing = circleRadius * 1.8; // Spacing between centers
      const rows = Math.ceil(r * 2.5 / spacing);
      const cols = Math.ceil(r * 2.5 / spacing);
      
      for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          
          // Only draw circles that fall within the dial
          const dist = Math.sqrt(x * x + y * y);
          if (dist < r * 0.92) {
            ctx.beginPath();
            ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
            
            // Fine lines with directional breathing effect
            // Calculate angle from center for directional shimmer
            const angle = Math.atan2(y, x);
            const shimmerPhase = Math.sin(Date.now() / 2000 + angle * 2) * 0.5 + 0.5;
            const directionalBreathe = breathe * 0.3 + shimmerPhase * 0.15;
            
            const baseOpacity = 0.025;
            ctx.strokeStyle = `rgba(0,0,0,${baseOpacity + directionalBreathe * 0.03})`;
            ctx.lineWidth = 0.3; // Very fine lines
            ctx.stroke();
          }
        }
      }
      
      ctx.restore();
      
      // Draw outer circle to mark edge of guilloche section
      ctx.save();
      ctx.translate(c, c);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }

    function drawMinuteTrack() {
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI) / 30 - Math.PI / 2;
        const outer = r * 0.985;
        const inner = r * (i % 5 === 0 ? 0.95 : 0.965);
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
        ctx.lineTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
      }
    }

    function drawBatons() {
      const outerRadius = r * 0.88; // Consistent outer radius for all batons
      const normalBatonLength = 20;
      const shortBatonLength = 12; // Shorter for positions with subdials/date
      
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6 - Math.PI / 2;
        
        // Determine baton length based on position
        let batonLength = normalBatonLength;
        if (i === 3 || i === 6 || i === 9) {
          batonLength = shortBatonLength;
        }
        
        const outer = outerRadius;
        const inner = outer - batonLength;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
        ctx.lineTo(c + Math.cos(a) * outer, c + Math.sin(a) * outer);
        ctx.strokeStyle = "#c9a24d";
        ctx.lineWidth = 5;
        ctx.lineCap = "square";
        ctx.stroke();
      }
    }

    function drawBreguetHand(angle: number, len: number, col: string) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle - Math.PI / 2);

      const pommeRadius = 12;
      const pommePosition = len * 0.75; // Pomme positioned 75% along the hand
      
      // Draw tapered hand shaft from center to pomme edge (no gap)
      ctx.beginPath();
      ctx.moveTo(0, -3.5);
      ctx.lineTo(pommePosition - pommeRadius, -1.8);
      ctx.lineTo(pommePosition - pommeRadius, 1.8);
      ctx.lineTo(0, 3.5);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      
      // Continue shaft from pomme edge to tip (no gap)
      ctx.beginPath();
      ctx.moveTo(pommePosition + pommeRadius, -1.2);
      ctx.lineTo(len, -0.4);
      ctx.lineTo(len, 0.4);
      ctx.lineTo(pommePosition + pommeRadius, 1.2);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      
      // Draw hollow pomme (open circle) on top of shafts
      ctx.beginPath();
      ctx.arc(pommePosition, 0, pommeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    function drawSecondsHand(angle: number) {
      const len = r * 0.85;
      const counterbalanceRadius = 5;
      
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle - Math.PI / 2);

      // Thin shaft with counterbalance
      ctx.beginPath();
      ctx.moveTo(-r * 0.15, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = "#0b2a5a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Counterbalance circle at bottom end
      ctx.beginPath();
      ctx.arc(-r * 0.15, 0, counterbalanceRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#0b2a5a";
      ctx.fill();

      ctx.restore();
    }

    function drawGMTHand(angle: number) {
      const len = r * 0.65;
      const arrowSize = 8;
      
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle - Math.PI / 2);

      // Shaft starts from center
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len - arrowSize, 0);
      ctx.strokeStyle = "#b00020";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();

      // Arrowhead - perfectly aligned with shaft
      ctx.beginPath();
      ctx.moveTo(len - arrowSize, -5);
      ctx.lineTo(len, 0);
      ctx.lineTo(len - arrowSize, 5);
      ctx.closePath();
      ctx.fillStyle = "#b00020";
      ctx.fill();

      ctx.restore();
    }

    function drawMoon(date: Date) {
      const rr = r * 0.18;
      const y = c + r * 0.56;

      ctx.save();
      
      // Create clipping region for the subdial aperture
      ctx.beginPath();
      ctx.arc(c, y, rr, 0, Math.PI * 2);
      ctx.clip();
      
      // Dark sky background
      ctx.fillStyle = "#0b1d3a";
      ctx.fillRect(c - rr, y - rr, rr * 2, rr * 2);
      
      // Add twinkling stars
      ctx.translate(c, y);
      const starPositions = [
        { x: -rr * 0.6, y: -rr * 0.4 },
        { x: rr * 0.7, y: -rr * 0.5 },
        { x: -rr * 0.5, y: rr * 0.6 },
        { x: rr * 0.5, y: rr * 0.3 },
        { x: -rr * 0.2, y: -rr * 0.7 },
        { x: rr * 0.3, y: -rr * 0.2 },
      ];
      
      starPositions.forEach(star => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(star.x - 0.5, star.y - 0.5, 1, 1);
      });
      
      // Get moon age in days
      const ref = new Date(Date.UTC(2000, 0, 6, 18, 14)); // New Moon reference
      const days = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
      const moonAge = ((days % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
      
      // Calculate horizontal offset for the moon disc
      // The disc with two moons travels left to right through the lunar cycle
      // At moonAge 0 (New Moon): left moon exits left, right moon enters right (mostly dark)
      // At moonAge ~7.4 (First Quarter): right moon is centered
      // At moonAge ~14.8 (Full Moon): right moon exits right, left moon is centered
      // At moonAge ~22.1 (Last Quarter): left moon is centered
      // At moonAge ~29.5: back to New Moon
      
      const moonRadius = rr * 0.45;
      const travelDistance = rr * 2; // Distance between the two moon centers on the disc
      
      // Normalize moon age to 0-1 range for the full cycle
      const cycleProgress = moonAge / LUNAR_CYCLE;
      
      // Calculate offset so that:
      // - At New Moon (0): moons are at edges of aperture (mostly dark)
      // - At Full Moon (0.5): left moon is centered showing full illumination
      const offset = (cycleProgress - 0.5) * travelDistance * 2;
      
      // Draw the traveling moon discs (two small moons against night sky)
      // Left moon with gradient
      ctx.beginPath();
      ctx.arc(offset - travelDistance, 0, moonRadius, 0, Math.PI * 2);
      
      const moonGrad = ctx.createRadialGradient(
        offset - travelDistance - moonRadius * 0.3,
        -moonRadius * 0.3,
        0,
        offset - travelDistance,
        0,
        moonRadius
      );
      moonGrad.addColorStop(0, "#f4d03f");
      moonGrad.addColorStop(0.6, "#d4af37");
      moonGrad.addColorStop(1, "#b8932a");
      ctx.fillStyle = moonGrad;
      ctx.fill();
      
      // Realistic craters on left moon
      const craters = [
        { x: offset - travelDistance - moonRadius * 0.3, y: -moonRadius * 0.2, r: moonRadius * 0.15 },
        { x: offset - travelDistance + moonRadius * 0.2, y: moonRadius * 0.3, r: moonRadius * 0.18 },
        { x: offset - travelDistance - moonRadius * 0.5, y: moonRadius * 0.25, r: moonRadius * 0.1 },
      ];
      
      craters.forEach(crater => {
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 112, 36, 0.4)";
        ctx.fill();
      });
      
      // Right moon (identical twin) with gradient
      ctx.beginPath();
      ctx.arc(offset + travelDistance, 0, moonRadius, 0, Math.PI * 2);
      
      const moonGrad2 = ctx.createRadialGradient(
        offset + travelDistance - moonRadius * 0.3,
        -moonRadius * 0.3,
        0,
        offset + travelDistance,
        0,
        moonRadius
      );
      moonGrad2.addColorStop(0, "#f4d03f");
      moonGrad2.addColorStop(0.6, "#d4af37");
      moonGrad2.addColorStop(1, "#b8932a");
      ctx.fillStyle = moonGrad2;
      ctx.fill();
      
      // Craters on right moon - same pattern
      const craters2 = [
        { x: offset + travelDistance - moonRadius * 0.3, y: -moonRadius * 0.2, r: moonRadius * 0.15 },
        { x: offset + travelDistance + moonRadius * 0.2, y: moonRadius * 0.3, r: moonRadius * 0.18 },
        { x: offset + travelDistance - moonRadius * 0.5, y: moonRadius * 0.25, r: moonRadius * 0.1 },
      ];
      
      craters2.forEach(crater => {
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 112, 36, 0.4)";
        ctx.fill();
      });
      
      ctx.restore();
      
      // Draw subdial border with silver outline on top (outside clip)
      ctx.beginPath();
      ctx.arc(c, y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "#c0c0c0"; // Silver
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // Inner dark border for definition
      ctx.beginPath();
      ctx.arc(c, y, rr - 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = "#0b1d3a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function drawSidereal(date: Date, breathe: number) {
      const rr = r * 0.23;
      const x = c - r * 0.55;

      // Subdial background
      ctx.beginPath();
      ctx.arc(x, c, rr, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f0";
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Guilloche pattern for sidereal subdial
      ctx.save();
      ctx.translate(x, c);
      
      // Create clipping region
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.9, 0, Math.PI * 2);
      ctx.clip();
      
      const circleRadius = rr * 0.035; // Fine pattern
      const spacing = circleRadius * 1.8;
      const rows = Math.ceil(rr * 2.5 / spacing);
      const cols = Math.ceil(rr * 2.5 / spacing);
      
      for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
          const dx = col * spacing;
          const dy = row * spacing;
          
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < rr * 0.9) {
            ctx.beginPath();
            ctx.arc(dx, dy, circleRadius, 0, Math.PI * 2);
            
            // Directional shimmer effect
            const angle = Math.atan2(dy, dx);
            const shimmerPhase = Math.sin(Date.now() / 2000 + angle * 2) * 0.5 + 0.5;
            const directionalBreathe = breathe * 0.3 + shimmerPhase * 0.15;
            
            const baseOpacity = 0.025;
            ctx.strokeStyle = `rgba(0,0,0,${baseOpacity + directionalBreathe * 0.03})`;
            ctx.lineWidth = 0.25;
            ctx.stroke();
          }
        }
      }
      
      ctx.restore();
      
      // Outer circle marking guilloche edge
      ctx.save();
      ctx.translate(x, c);
      ctx.beginPath();
      ctx.arc(0, 0, rr * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.restore();

      // Draw numerals at 12, 3, 6, 9
      ctx.fillStyle = "#111";
      ctx.font = "12px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // 12 (top)
      ctx.fillText("12", x, c - rr * 0.65);
      // 3 (right)
      ctx.fillText("3", x + rr * 0.65, c);
      // 6 (bottom)
      ctx.fillText("6", x, c + rr * 0.65);
      // 9 (left)
      ctx.fillText("9", x - rr * 0.65, c);

      // Hand
      ctx.save();
      ctx.translate(x, c);
      ctx.rotate(getSiderealAngle(date) - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rr * 0.55, 0);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }

    function drawDate(date: Date) {
      const w = r * 0.3;
      const h = r * 0.2;
      const x = c + r * 0.55 - w / 2;

      ctx.fillStyle = "#fff";
      ctx.fillRect(x, c - h / 2, w, h);
      ctx.strokeStyle = "#e5e4e2"; // Platinum outline
      ctx.lineWidth = 2;
      ctx.strokeRect(x, c - h / 2, w, h);

      ctx.fillStyle = "#020047";
      ctx.font = "28px 'Palatino Linotype', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(date.getDate().toString(), x + w / 2, c);
    }

    function drawSwissMade() {
      const swiss = "SWISS";
      const made = "MADE";
      const radius = r * 0.82;
      
      ctx.save();
      ctx.translate(c, c);
      ctx.font = "9px serif"; // Smaller font (was 11px)
      ctx.fillStyle = "#e5e4e2"; // Platinum color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // SWISS between 7 and 6 (going clockwise from 7 to 6)
      // 7 o'clock = 210° = 7π/6, 6 o'clock = 180° = π
      const swissArcLength = Math.PI / 8; // Use 1/8 of circle (22.5°)
      const swissCenter = (7 * Math.PI) / 6 - Math.PI / 12; // Centered between 7 and 6
      const swissStart = swissCenter - swissArcLength / 2;
      const swissStep = swissArcLength / (swiss.length - 1);
      
      // Reverse iteration to draw letters in correct order
      [...swiss].reverse().forEach((ch, i) => {
        const a = swissStart + i * swissStep;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -radius);
        ctx.rotate(Math.PI);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      // MADE between 6 and 5 (going clockwise from 6 to 5)
      // 6 o'clock = 180° = π, 5 o'clock = 150° = 5π/6
      const madeArcLength = Math.PI / 10; // Smaller arc for 4 letters
      const madeCenter = (11 * Math.PI) / 12; // Centered between 6 and 5
      const madeStart = madeCenter - madeArcLength / 2;
      const madeStep = madeArcLength / (made.length - 1);
      
      // Reverse iteration to draw letters in correct order
      [...made].reverse().forEach((ch, i) => {
        const a = madeStart + i * madeStep;
        ctx.save();
        ctx.rotate(a);
        ctx.translate(0, -radius);
        ctx.rotate(Math.PI);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    }

    function drawWatch() {
      ctx.clearRect(0, 0, size, size);
      
      // Calculate breathing effect (slow sine wave)
      const breathe = Math.sin(Date.now() / 3000) * 0.5 + 0.5; // 0 to 1

      // Main dial FIRST (underneath case)
      // Deep blue enamel dial - celestial theme
      const dialGradient = ctx.createRadialGradient(c, c, 0, c, c, r);
      dialGradient.addColorStop(0, "#1a2a4a");
      dialGradient.addColorStop(0.7, "#0f1a35");
      dialGradient.addColorStop(1, "#0a0f20");
      
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = dialGradient;
      ctx.fill();
      ctx.strokeStyle = "#0a0f20";
      ctx.lineWidth = 4;
      ctx.stroke();

      // No guilloche on enamel dial
      drawMinuteTrack();
      drawBatons();

      // Roman numerals at hour positions - platinum for contrast
      ctx.fillStyle = "#e5e4e2";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // XII stays larger and at original position
      ctx.font = "26px serif";
      ctx.fillText("XII", c, c - r * 0.72);
      
      // Other numerals are slightly smaller and positioned between center and batons
      ctx.font = "22px serif";
      const smallNumerals = [
        { text: "I", angle: -Math.PI / 2 + Math.PI / 6 },
        { text: "II", angle: -Math.PI / 2 + 2 * Math.PI / 6 },
        { text: "IV", angle: -Math.PI / 2 + 4 * Math.PI / 6 },
        { text: "V", angle: -Math.PI / 2 + 5 * Math.PI / 6 },
        { text: "VII", angle: -Math.PI / 2 + 7 * Math.PI / 6 },
        { text: "VIII", angle: -Math.PI / 2 + 8 * Math.PI / 6 },
        { text: "X", angle: -Math.PI / 2 + 10 * Math.PI / 6 },
        { text: "XI", angle: -Math.PI / 2 + 11 * Math.PI / 6 },
      ];
      
      smallNumerals.forEach(({ text, angle }) => {
        const radius = r * 0.70; // 70% back toward original (was 0.65, original was 0.72)
        const x = c + Math.cos(angle) * radius;
        const y = c + Math.sin(angle) * radius;
        ctx.fillText(text, x, y);
      });

      // Brand text - platinum
      ctx.fillStyle = "#e5e4e2";
      ctx.font = "18px serif";
      ctx.fillText("David Turner", c, c - r * 0.25);
      ctx.font = "14px serif";
      ctx.fillText("Horology", c, c - r * 0.18);

      drawSwissMade();

      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      const g = (now.getHours() + gmtOffset + m / 60) % 24;

      // Draw complications
      drawMoon(now);
      drawSidereal(now, breathe);
      drawDate(now);

      // Draw hands (largest to smallest)
      drawGMTHand((g * Math.PI) / 12);
      drawBreguetHand((h * Math.PI) / 6, r * 0.5, "#e5e4e2"); // Platinum hour hand
      drawBreguetHand((m * Math.PI) / 30, r * 0.7, "#e5e4e2"); // Platinum minute hand
      drawSecondsHand((s * Math.PI) / 30);

      // Center pin
      ctx.beginPath();
      ctx.arc(c, c, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
      
      // Draw watch case (frames the dial and hands)
      drawCase();
      
      // Draw sapphire crystal reflection (last, on top of everything)
      drawCrystal(breathe);
    }
    
    // Load SVG case image
    const caseImage = new Image();
    caseImage.src = 'data:image/svg+xml;base64,' + btoa(`<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 560 560" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><g transform="translate(41.229247311827976, 7.099641577060936) scale(0.2867383512544803)"><g><g><g id="Crown"><g><path d="M1741.285,860.778l2.343,196.779c0,0 5.45,-97.61 4.685,-105.417c-0.764,-7.807 -2.973,-84.136 -7.028,-91.362Z" style="fill:#80635f;"/><path d="M1654.609,860.778l11.713,-18.741l58.565,0l11.713,16.398l-7.028,-4.685l-2.343,7.028l-60.908,0l2.343,-9.37l-14.056,9.37Z" style="fill:#faf4da;"/><path d="M1727.23,853.75l11.713,14.056l0,72.621l0,-4.776l-7.028,-11.622l4.685,-9.37l-7.028,-16.398l2.343,-7.028l-4.685,-9.37l2.343,-9.37l-2.343,-18.741Z" style="fill:#884b2e;stroke:#d2907a;stroke-width:2.5px;"/><path d="M1666.322,1078.64l60.908,0l-7.028,14.056l-49.195,0l-4.685,-14.056Z" style="fill:#f1e0c2;"/><path d="M1666.322,1064.585l65.593,0l-4.685,11.713l-56.223,0l-4.685,-11.713Z" style="fill:#edcca9;"/><path d="M1671.012,1042.033c0,0 57.177,-0.738 57.134,0.276" style="fill:none;stroke:#c08a68;stroke-width:10.42px;"/><path d="M1654.609,980.251l11.713,0l0,7.028l7.028,7.028l-9.37,11.713l9.37,11.713l-11.713,14.056l9.37,9.37l-11.713,7.028l11.713,11.713l-9.37,4.685l7.028,9.37l-9.37,-4.685l2.343,7.028l-11.713,-7.028l0,-105.417l4.685,16.398Z" style="fill:url(#_Linear2);stroke:#291f17;stroke-width:2.5px;"/><path d="M1668.664,851.408l-16.398,16.398l0,93.704l11.713,0l7.028,-14.056l-7.028,-9.37l7.028,-14.056l-7.028,-9.37l7.028,-14.056l-7.028,-7.028l4.685,-14.056l-4.685,-2.343l4.685,-9.37l-4.685,-2.343l4.685,-14.056Z" style="fill:url(#_Linear3);stroke:#291f17;stroke-width:2.5px;"/><path d="M1736.6,935.741l-7.028,9.37l7.028,9.37l0,7.028l-7.028,7.028l7.028,9.37l9.37,2.343l-2.343,-25.769l-7.028,-18.741Z" style="fill:#19160f;stroke:#291f17;stroke-width:2.5px;"/><path d="M1656.951,961.51l-2.343,4.685l0,11.713l11.713,0l7.028,-7.028l-11.713,-9.37l-4.685,0Z" style="fill:#19160f;stroke:#291f17;stroke-width:2.5px;"/><path d="M1675.692,900.602l-9.37,11.713l67.936,2.343l-7.028,-14.056l-51.537,0Z" style="fill:#fffafa;stroke:#fffafa;stroke-width:2.5px;"/><path d="M1675.692,921.686l-7.028,12.09l65.593,-0.377l-7.028,-11.713l-51.537,0Z" style="fill:#fffafa;stroke:#fffafa;stroke-width:2.5px;"/><path d="M1675.692,945.112l-7.028,7.405l65.593,-0.231l-7.028,-7.174l-51.537,0Z" style="fill:#fffafa;stroke:#fffafa;stroke-width:2.5px;"/><path d="M1727.23,1014.607l7.028,-7.405l-65.593,0.231l7.028,7.174l51.537,0Z" style="fill:#f1e0c2;stroke:#fffafa;stroke-width:2.5px;"/><path d="M1724.565,1048.563l7.028,-7.405l-65.593,0.231l7.028,7.174l51.537,0Z" style="fill:#f1e0c2;stroke:#fffafa;stroke-width:2.5px;"/><path d="M1649.924,863.121l18.741,-23.426l53.88,0l21.083,21.083" style="fill:none;stroke:#302013;stroke-width:0.83px;"/><path d="M1652.266,860.778l14.056,-21.083l58.565,0l16.398,23.426l0,196.779l-18.741,32.796l-51.537,2.343l-23.426,-25.769l4.685,-208.492Z" style="fill:none;stroke:#302013;stroke-width:2.5px;"/><path d="M1666.322,860.778l2.343,4.685l0,9.37l2.343,2.343l53.88,0l2.343,-16.398l-60.908,0Z" style="fill:#edc9a9;"/><path d="M1675.692,879.519l-9.37,14.056l65.593,0l-7.028,-14.056l-49.195,0Z" style="fill:#3a1115;stroke:#302013;stroke-width:2.5px;"/><path d="M1722.544,1062.242l9.37,-16.398l-65.593,0l7.028,16.398l49.195,0Z" style="fill:#3a1115;stroke:#302013;stroke-width:2.5px;"/><path d="M1666.322,917.001l7.028,4.685l53.88,-2.343l7.028,-4.685l-67.936,0" style="fill:#e69264;stroke:#f3925f;stroke-width:2.5px;"/><path d="M1666.322,938.084l7.028,4.685l53.88,-2.343l7.028,-4.685l-67.936,0" style="fill:#e69264;stroke:#f3925f;stroke-width:2.5px;"/><path d="M1666.322,959.167l7.028,7.028l53.88,0l7.028,-9.37l-67.936,0" style="fill:#e69264;stroke:#f3925f;stroke-width:2.5px;"/><path d="M1666.322,977.908l6.648,8.946l55.78,-0.347l2.521,-11.772l-64.454,0.386" style="fill:#e69264;stroke:#f3925f;stroke-width:2.5px;"/><path d="M1731.271,1002.422l-4.662,-6.912l-56.055,0.195l-3.874,10.883l64.096,-1.378" style="fill:#e69264;stroke:#f3925f;stroke-width:2.5px;"/><path d="M1666.322,1029.446l67.936,-2.343l-7.028,14.056l-56.223,0l-7.028,-11.713" style="fill:#ac6a4a;stroke:#ac6a4a;stroke-width:2.5px;"/></g></g><path d="M1246.995,1671.32l-2.343,276.427l77.306,2.343l4.685,-332.65" style="fill:url(#_Linear4);stroke:#302013;stroke-width:0.83px;"/><path d="M324.009,1617.44l0,334.993l81.991,0l-2.343,-283.455" style="fill:url(#_Radial5);stroke:#302013;stroke-width:1.04px;"/><path d="M1239.968,1.042l81.991,0l4.685,299.854c0,0 -76.544,-58.78 -84.334,-60.908c-7.79,-2.128 -2.343,-238.946 -2.343,-238.946Z" style="fill:url(#_Linear6);stroke:#302013;stroke-width:1.25px;"/><path d="M324.009,296.21c-1.066,-8.75 2.348,-284.951 2.343,-295.168l84.334,-0l0,236.603" style="fill:url(#_Linear7);stroke:#302013;stroke-width:2.08px;"/><path d="M825.326,127.542c455.108,0 824.597,371.589 824.597,829.282c0,457.693 -369.49,829.282 -824.597,829.282c-455.108,0 -824.597,-371.589 -824.597,-829.282c0,-457.693 369.49,-829.282 824.597,-829.282Zm1.417,89.822c-152.269,0 -290.803,46.574 -405.087,122.147c-34.912,23.087 -64.738,51.285 -94.824,79.882c-139.027,132.145 -226.152,317.838 -226.152,533.122c0,227.36 98.133,422.946 252.231,556.001c126.757,109.448 290.371,177.596 477.101,177.596c246.088,0 457.283,-116.183 591.064,-294.904c91.138,-121.752 148.354,-270.786 148.354,-438.694c0,-168.981 -57.632,-320.637 -150.48,-443.08c-134.836,-177.816 -347.191,-292.072 -592.207,-292.072Z" style="fill:url(#_Linear8);stroke:#302013;stroke-width:1.46px;"/></g></g><defs><linearGradient id="_Linear2" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(11.713029,0,0,0.000002,1654.608818,980.250865)"><stop offset="0" style="stop-color:#722e1b;stop-opacity:1"/><stop offset="0.24" style="stop-color:#7e3a26;stop-opacity:1"/><stop offset="0.32" style="stop-color:#995640;stop-opacity:1"/><stop offset="0.39" style="stop-color:#b4725a;stop-opacity:1"/><stop offset="0.58" style="stop-color:#903d2b;stop-opacity:1"/><stop offset="0.83" style="stop-color:#87301f;stop-opacity:1"/><stop offset="1" style="stop-color:#5e291c;stop-opacity:1"/></linearGradient><linearGradient id="_Linear3" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(18.740846,0,0,110.10247,1652.266212,906.458785)"><stop offset="0" style="stop-color:#722e1b;stop-opacity:1"/><stop offset="0.24" style="stop-color:#7e3a26;stop-opacity:1"/><stop offset="0.32" style="stop-color:#995640;stop-opacity:1"/><stop offset="0.39" style="stop-color:#b4725a;stop-opacity:1"/><stop offset="0.58" style="stop-color:#903d2b;stop-opacity:1"/><stop offset="0.83" style="stop-color:#87301f;stop-opacity:1"/><stop offset="1" style="stop-color:#5e291c;stop-opacity:1"/></linearGradient><linearGradient id="_Linear4" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-77.305989,9.370423,-9.370423,-77.305989,1324.301409,1753.310759)"><stop offset="0" style="stop-color:#f2e5dd;stop-opacity:1"/><stop offset="1" style="stop-color:#d5a581;stop-opacity:1"/></linearGradient><radialGradient id="_Radial5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(37.481692,-103.074653,103.074653,37.481692,335.721787,1844.672383)"><stop offset="0" style="stop-color:#f2e5dd;stop-opacity:1"/><stop offset="0.31" style="stop-color:#efcbab;stop-opacity:1"/><stop offset="0.39" style="stop-color:#f0c9ac;stop-opacity:1"/><stop offset="0.6" style="stop-color:#edcba8;stop-opacity:1"/><stop offset="1" style="stop-color:#d6a682;stop-opacity:1"/></radialGradient><linearGradient id="_Linear6" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(56.222538,248.316208,-248.316208,56.222538,1246.99542,3.384272)"><stop offset="0" style="stop-color:#f2e5dd;stop-opacity:1"/><stop offset="0.29" style="stop-color:#edcba8;stop-opacity:1"/><stop offset="0.85" style="stop-color:#f0c9ac;stop-opacity:1"/><stop offset="1" style="stop-color:#d5a581;stop-opacity:1"/></linearGradient><linearGradient id="_Linear7" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(63.250355,213.177122,-213.177122,63.250355,338.064393,10.41209)"><stop offset="0" style="stop-color:#f2e5dd;stop-opacity:1"/><stop offset="0.35" style="stop-color:#f0c9ac;stop-opacity:1"/><stop offset="0.54" style="stop-color:#edcba8;stop-opacity:1"/><stop offset="0.77" style="stop-color:#d5a581;stop-opacity:1"/><stop offset="1" style="stop-color:#d5a581;stop-opacity:1"/></linearGradient><linearGradient id="_Linear8" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(316.251775,1548.462393,-1548.462393,316.251775,581.69539,195.477943)"><stop offset="0" style="stop-color:#f2e5dd;stop-opacity:1"/><stop offset="0.19" style="stop-color:#f0c9ac;stop-opacity:1"/><stop offset="0.44" style="stop-color:#f0c9ae;stop-opacity:1"/><stop offset="0.53" style="stop-color:#f0eff4;stop-opacity:1"/><stop offset="0.57" style="stop-color:#edcba8;stop-opacity:1"/><stop offset="0.93" style="stop-color:#d5a581;stop-opacity:1"/><stop offset="1" style="stop-color:#302013;stop-opacity:1"/></linearGradient></defs></g></svg>`);
    
    function drawCase() {
      // Simply draw the SVG case image
      ctx.drawImage(caseImage, 0, 0, size, size);
    }
    
    function drawCrystal(breathe: number) {
      // Sapphire crystal reflection - very subtle
      ctx.save();
      
      // Curved reflection across the crystal
      const reflectionGradient = ctx.createLinearGradient(
        c - r * 0.6, 
        c - r * 0.8, 
        c + r * 0.6, 
        c + r * 0.3
      );
      
      // Animate the reflection slightly with breathing
      const reflectionIntensity = 0.08 + breathe * 0.02;
      
      reflectionGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
      reflectionGradient.addColorStop(0.3, `rgba(255, 255, 255, ${reflectionIntensity})`);
      reflectionGradient.addColorStop(0.5, `rgba(255, 255, 255, ${reflectionIntensity * 1.5})`);
      reflectionGradient.addColorStop(0.7, `rgba(255, 255, 255, ${reflectionIntensity})`);
      reflectionGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      
      // Clip to dial area
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw reflection arc
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(c - r, c - r, r * 2, r * 2);
      
      ctx.restore();
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
    <main className="flex min-h-screen items-center justify-center bg-black">
      <canvas ref={canvasRef} className="rounded-full shadow-2xl" />
    </main>
  );
}
