"use client";

import { useEffect, useRef, useState } from "react";

export type MascotMood = "curious" | "thinking" | "happy" | "excited";

const EYE_TRAVEL = 3;

export function Mascot({ mood }: { mood: MascotMood }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
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
      setPupil({ x: (dx / dist) * EYE_TRAVEL * clamped, y: (dy / dist) * EYE_TRAVEL * clamped });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Periodic blink.
  useEffect(() => {
    const interval = setInterval(
      () => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 140);
      },
      2400 + Math.random() * 2200
    );
    return () => clearInterval(interval);
  }, []);

  function handlePoke() {
    setPoked(true);
    setTimeout(() => setPoked(false), 400);
  }

  const mouthPath = getMouthPath(mood);
  const bobSpeed = mood === "excited" ? 1.6 : mood === "thinking" ? 3.2 : 2.4;

  return (
    <div
      ref={containerRef}
      className="cursor-pointer select-none"
      onClick={handlePoke}
      style={{
        animation: `mascot-bob ${bobSpeed}s ease-in-out infinite`,
      }}
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        style={{
          transform: poked ? "scale(1.12, 0.9)" : "scale(1, 1)",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "center",
        }}
      >
        <defs>
          <linearGradient id="mascotHead" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>

        {/* antenna */}
        <line x1="36" y1="6" x2="36" y2="16" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
        <circle
          cx="36"
          cy="5"
          r="3"
          fill="#c4b5fd"
          style={{
            animation: mood === "excited" ? "mascot-antenna-pulse 0.8s ease-in-out infinite" : undefined,
          }}
        />

        {/* head — rounded square, matches the Oviflow logo's robot icon */}
        <rect x="8" y="16" width="56" height="48" rx="20" fill="url(#mascotHead)" />

        {/* ears */}
        <rect x="2" y="32" width="8" height="16" rx="4" fill="#7c3aed" />
        <rect x="62" y="32" width="8" height="16" rx="4" fill="#7c3aed" />

        {/* eyes */}
        {["left", "right"].map((side) => {
          const cx = side === "left" ? 26 : 46;
          return (
            <g key={side}>
              <ellipse cx={cx} cy="38" rx="7.5" ry={blinking ? 0.5 : 9} fill="white" />
              {!blinking && <circle cx={cx + pupil.x} cy={38 + pupil.y} r="3.8" fill="#312e81" />}
            </g>
          );
        })}

        {/* mouth */}
        <path d={mouthPath} stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* cheeks when excited */}
        {mood === "excited" && (
          <>
            <circle cx="16" cy="50" r="3.5" fill="#f472b6" opacity="0.6" />
            <circle cx="56" cy="50" r="3.5" fill="#f472b6" opacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}

function getMouthPath(mood: MascotMood): string {
  switch (mood) {
    case "thinking":
      return "M 29 53 Q 36 50 43 53";
    case "excited":
      return "M 25 51 Q 36 63 47 51";
    case "happy":
      return "M 27 51 Q 36 59 45 51";
    case "curious":
    default:
      return "M 28 52 Q 36 56 44 52";
  }
}
