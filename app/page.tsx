'use client';

import { useEffect, useRef } from 'react';

export default function WatchFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    const c = size / 2;
    const r = c - 20;

    let gmtOffset = 0;

    /* ───────── Dial Base ───────── */

    function drawDialBase() {
      const radial = ctx.createRadialGradient(c, c, r * 0.15, c, c, r);
      radial.addColorStop(0, '#f8f7f3');
      radial.addColorStop(0.65, '#f0efe9');
      radial.addColorStop(1, '#e3e1d8');

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();

      const angle = (Date.now() / 12000) % (Math.PI * 2);
      const sweep = ctx.createLinearGradient(
        c + Math.cos(angle) * r,
        c + Math.sin(angle) * r,
        c - Math.cos(angle) * r,
        c - Math.sin(angle) * r
      );

      sweep.addColorStop(0, 'rgba(255,255,255,0.22)');
      sweep.addColorStop(0.5, 'rgba(255,255,255,0)');
      sweep.addColorStop(1, 'rgba(0,0,0,0.1)');

      ctx.fillStyle = sweep;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ───────── Minute Track ───────── */

    function drawMinuteTrack() {
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI) / 30;
        const isFive = i % 5 === 0;

        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a);
        ctx.translate(0, -r + 6);

        ctx.strokeStyle = '#222';
        ctx.lineWidth = isFive ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, isFive ? 10 : 6);
        ctx.stroke();

        ctx.restore();
      }
    }

    /* ───────── Indices ───────── */

    function drawIndices() {
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;

        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(a);
        ctx.translate(0, -r + 18);

        const w = 5;
        const h = 18;

        ctx.fillStyle = '#d4af37';
        ctx.fillRect(-w / 2, 0, w, h);

        const glint = ctx.createLinearGradient(0, 0, 0, h);
        glint.addColorStop(0, 'rgba(255,255,255,0.9)');
        glint.addColorStop(0.5, 'rgba(255,255,255,0)');
        glint.addColorStop(1, 'rgba(0,0,0,0.35)');

        ctx.fillStyle = glint;
        ctx.fillRect(-w / 2, 0, w, h);

        ctx.restore();
      }
    }

    /* ───────── Hands ───────── */

    function drawHands(date: Date) {
      const h = date.getHours() % 12;
      const m = date.getMinutes();
      const s = date.getSeconds();

      const hourAngle = ((h + m / 60) * Math.PI) / 6;
      const minAngle = ((m + s / 60) * Math.PI) / 30;
      const secAngle = (s * Math.PI) / 30;
      const gmtAngle = (((date.getUTCHours() + gmtOffset) % 24) * Math.PI) / 12;

      function hand(angle: number, len: number, w: number, col: string) {
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(angle - Math.PI / 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.restore();
      }

      hand(hourAngle, r * 0.45, 6, '#000');
      hand(minAngle, r * 0.7, 4, '#000');
      hand(secAngle, r * 0.75, 2, '#c00');
      hand(gmtAngle, r * 0.6, 3, '#0a2d5e');
    }

    /* ───────── Date Window ───────── */

    function drawDate(date: Date) {
      const x = c + r * 0.45;
      const y = c - 18;
      const w = 46;
      const h = 28;

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#0a2d5e';
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(date.getDate().toString(), x + w / 2, y + h / 2 + 1);
    }

    /* ───────── Moon Phase ───────── */

    function drawMoon(date: Date) {
      const phase =
        ((date.getTime() / 1000 / 86400 + 4.867) % 29.53) / 29.53;

      const mx = c;
      const my = c + r * 0.45;
      const mr = 30;

      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, mr + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0a2d5e';
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(mx - mr * (1 - 2 * phase), my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ───────── Sidereal Subdial ───────── */

    function drawSidereal(date: Date) {
      const gst =
        ((date.getUTCHours() +
          date.getUTCMinutes() / 60 +
          date.getUTCSeconds() / 3600) *
          1.0027379) %
        24;

      const angle = (gst * Math.PI) / 12;

      const sx = c - r * 0.45;
      const sy = c;

      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();
    }

    function drawText() {
      ctx.fillStyle = '#0a2d5e';
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillText('David Turner', c, c - r * 0.3);
    }

    function render() {
      ctx.clearRect(0, 0, size, size);
      const now = new Date();

      drawDialBase();
      drawMinuteTrack();
      drawIndices();
      drawText();
      drawDate(now);
      drawMoon(now);
      drawSidereal(now);
      drawHands(now);

      requestAnimationFrame(render);
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') gmtOffset++;
      if (e.key === 'ArrowLeft') gmtOffset--;
    });

    render();
  }, []);

  return (
    <div
      style={{
        background: '#111',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
