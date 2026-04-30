"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface BurstSpec {
  d: number;
  x: number;
  y: number;
}

const COLORS = ["#C5F432", "#00F0FF", "#FF00E5", "#FFD700", "#FF6B35", "#9D4EDD"];
const PARTICLES_PER_BURST = 28;
const STOP_AFTER_MS = 3000;
const BURSTS: BurstSpec[] = [
  { d: 0, x: 0.3, y: 0.35 },
  { d: 200, x: 0.7, y: 0.3 },
  { d: 450, x: 0.5, y: 0.55 },
  { d: 700, x: 0.22, y: 0.6 },
  { d: 900, x: 0.78, y: 0.5 },
  { d: 1150, x: 0.5, y: 0.25 },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const particles: Particle[] = [];

    const burst = (x: number, y: number) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < PARTICLES_PER_BURST; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLES_PER_BURST + Math.random() * 0.2;
        const speed = 1.5 + Math.random() * 3.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          color,
          size: 1.5 + Math.random() * 2.2,
        });
      }
    };

    const timeouts = BURSTS.map((b) =>
      setTimeout(() => burst(canvas.width * b.x, canvas.height * b.y), b.d),
    );

    let raf = 0;
    const stopAt = Date.now() + STOP_AFTER_MS;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 14;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.life * 0.4;
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 1.5, p.y - p.vy * 1.5, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (particles.length > 0 || Date.now() < stopAt) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timeouts.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
}
