"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type MascotMood = "curious" | "thinking" | "happy" | "excited";

interface MascotProps {
  mood: MascotMood;
}

const EYE_TRAVEL = 3.5;

export function Mascot({ mood }: MascotProps) {
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
      const clamped = Math.min(dist, 200) / 200;
      setPupil({
        x: (dx / dist) * EYE_TRAVEL * clamped,
        y: (dy / dist) * EYE_TRAVEL * clamped,
      });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Periodic blink.
  useEffect(() => {
    const interval = setInterval(
      () => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
      },
      2600 + Math.random() * 2000
    );
    return () => clearInterval(interval);
  }, []);

  function handlePoke() {
    setPoked(true);
    setTimeout(() => setPoked(false), 400);
  }

  const mouthPath = getMouthPath(mood);

  return (
    <motion.div
      ref={containerRef}
      className="cursor-pointer select-none"
      onClick={handlePoke}
      animate={{ y: [0, -8, 0], rotate: mood === "excited" ? [0, -3, 3, 0] : 0 }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 0.6, repeat: mood === "excited" ? Infinity : 0, repeatDelay: 1.2 },
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        animate={poked ? { scaleX: 1.12, scaleY: 0.88 } : { scaleX: 1, scaleY: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <defs>
          <radialGradient id="mascotGradient" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
        </defs>

        {/* trailing flow wisp */}
        <motion.path
          d="M 20 22 Q 8 14 4 4"
          stroke="#c4b5fd"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* body */}
        <ellipse cx="48" cy="50" rx="40" ry="38" fill="url(#mascotGradient)" />

        {/* eyes */}
        {["left", "right"].map((side) => {
          const cx = side === "left" ? 35 : 61;
          return (
            <g key={side}>
              <ellipse cx={cx} cy="46" rx="9" ry={blinking ? 0.5 : 11} fill="white" />
              {!blinking && (
                <circle cx={cx + pupil.x} cy={46 + pupil.y} r="4.5" fill="#312e81" />
              )}
            </g>
          );
        })}

        {/* mouth */}
        <path d={mouthPath} stroke="#312e81" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* cheeks when excited */}
        {mood === "excited" && (
          <>
            <circle cx="24" cy="58" r="4" fill="#f472b6" opacity="0.5" />
            <circle cx="72" cy="58" r="4" fill="#f472b6" opacity="0.5" />
          </>
        )}
      </motion.svg>
    </motion.div>
  );
}

function getMouthPath(mood: MascotMood): string {
  switch (mood) {
    case "thinking":
      return "M 40 66 Q 48 62 56 66";
    case "excited":
      return "M 34 62 Q 48 78 62 62";
    case "happy":
      return "M 36 63 Q 48 73 60 63";
    case "curious":
    default:
      return "M 38 65 Q 48 70 58 65";
  }
}
