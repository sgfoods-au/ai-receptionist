"use client";

import { useEffect, useRef, useState } from "react";

export type MascotMood = "curious" | "thinking" | "happy" | "excited";

const EYE_TRAVEL = 4;

export function Mascot({ mood }: { mood: MascotMood }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flicker, setFlicker] = useState(false);
  const [poked, setPoked] = useState(false);

  // Eyes track the cursor anywhere on the page.
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(dist, 220) / 220;
      setTilt({ x: (dx / dist) * EYE_TRAVEL * clamped, y: (dy / dist) * EYE_TRAVEL * clamped });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Periodic sensor flicker (the "blink" reimagined for a machine).
  useEffect(() => {
    const interval = setInterval(
      () => {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 120);
      },
      2400 + Math.random() * 2200
    );
    return () => clearInterval(interval);
  }, []);

  function handlePoke() {
    setPoked(true);
    setTimeout(() => setPoked(false), 400);
  }

  const bobSpeed = mood === "excited" ? 1.6 : mood === "thinking" ? 3.2 : 2.4;
  const barHeights = getWaveform(mood);
  const eqSpeed = mood === "excited" ? 0.6 : mood === "thinking" ? 1.4 : 0.9;

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      onClick={handlePoke}
      style={{
        animation: `mascot-bob ${bobSpeed}s ease-in-out infinite`,
      }}
    >
      {/* outer glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-md animate-core-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(99,102,241,0.25) 55%, transparent 75%)",
        }}
      />

      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        className="relative"
        style={{
          transform: poked ? "scale(1.14, 0.88)" : "scale(1, 1)",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "center",
        }}
      >
        <defs>
          <linearGradient id="mascotCore" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>

        {/* orbiting rings */}
        <g
          className="animate-ring-rotate"
          style={{ transformOrigin: "36px 38px", transformBox: "fill-box" }}
        >
          <circle
            cx="36"
            cy="38"
            r="32"
            fill="none"
            stroke="#c4b5fd"
            strokeWidth="1.5"
            strokeDasharray="6 10"
            opacity="0.6"
          />
        </g>
        <g
          className="animate-ring-rotate-reverse"
          style={{ transformOrigin: "36px 38px", transformBox: "fill-box" }}
        >
          <circle
            cx="36"
            cy="38"
            r="27"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1"
            strokeDasharray="2 8"
            opacity="0.5"
          />
        </g>

        {/* beacon */}
        <line x1="36" y1="4" x2="36" y2="12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        <circle
          cx="36"
          cy="3"
          r="2.6"
          fill="#c4b5fd"
          style={{
            animation:
              mood === "excited" ? "mascot-antenna-pulse 0.8s ease-in-out infinite" : "mascot-antenna-pulse 2.6s ease-in-out infinite",
          }}
        />

        {/* core — hexagonal AI plate */}
        <path
          d="M36 12 L58 24 V50 L36 62 L14 50 V24 Z"
          fill="url(#mascotCore)"
          stroke="#ede9fe"
          strokeOpacity="0.4"
          strokeWidth="1"
        />

        {/* eyes — vertical light bars */}
        {["left", "right"].map((side) => {
          const cx = side === "left" ? 27 : 45;
          return (
            <rect
              key={side}
              x={cx - 2.2 + tilt.x * 0.4}
              y={flicker ? 33 : 27 + tilt.y * 0.3}
              width="4.4"
              height={flicker ? 1.5 : 12}
              rx="2.2"
              fill="#f5f3ff"
              style={{ transition: "y 0.12s ease, height 0.12s ease" }}
            />
          );
        })}

        {/* mouth — animated equalizer */}
        {barHeights.map((h, i) => (
          <rect
            key={i}
            x={22 + i * 6.5}
            y={48 - h / 2}
            width="3.2"
            height={h}
            rx="1.6"
            fill="#f5f3ff"
            opacity="0.9"
            style={{
              transformOrigin: "center",
              animation: `eq-bounce ${eqSpeed + i * 0.08}s ease-in-out infinite`,
              animationDelay: `${i * 0.09}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function getWaveform(mood: MascotMood): number[] {
  switch (mood) {
    case "excited":
      return [5, 9, 12, 9, 5];
    case "thinking":
      return [3, 4, 5, 4, 3];
    case "happy":
      return [4, 7, 9, 7, 4];
    case "curious":
    default:
      return [4, 6, 7, 6, 4];
  }
}
