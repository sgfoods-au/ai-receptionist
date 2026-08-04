"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type MascotMood = "curious" | "thinking" | "happy" | "excited";

interface MascotProps {
  mood: MascotMood;
}

// Eye positions as percentages of the badge image, measured from the source art.
const LEFT_EYE = { left: 47, top: 35.5, width: 7, height: 7 };
const RIGHT_EYE = { left: 58.5, top: 33, width: 7.5, height: 6.5 };

export function Mascot({ mood }: MascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [poked, setPoked] = useState(false);

  // Subtle lean toward the cursor, anywhere on the page.
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      setTiltDeg(Math.max(-6, Math.min(6, dx * 16)));
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  function handlePoke() {
    setPoked(true);
    setTimeout(() => setPoked(false), 400);
  }

  const waveSpeed = mood === "excited" ? 0.8 : mood === "thinking" ? 2.6 : 1.8;
  const blinkSpeed = mood === "excited" ? 2.2 : 4;

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      onClick={handlePoke}
      style={{
        transform: `rotate(${tiltDeg}deg) scale(${poked ? 1.1 : 1})`,
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {mood === "excited" && (
        <>
          <Spark className="-top-2 -left-3" delay={0} />
          <Spark className="-top-3 right-2" delay={0.35} />
          <Spark className="top-1 -right-4" delay={0.7} />
        </>
      )}

      <div
        className="relative h-28 w-28 overflow-hidden rounded-full"
        style={{
          animation: `mascot-float 3s ease-in-out infinite, mascot-wave ${waveSpeed}s ease-in-out infinite`,
        }}
      >
        <Image
          src="/receptionist-badge.png"
          alt="Your Oviflow AI receptionist"
          fill
          sizes="112px"
          className="object-cover"
          priority
        />

        <Eyelid pos={LEFT_EYE} duration={blinkSpeed} />
        <Eyelid pos={RIGHT_EYE} duration={blinkSpeed} />
      </div>
    </div>
  );
}

function Eyelid({
  pos,
  duration,
}: {
  pos: { left: number; top: number; width: number; height: number };
  duration: number;
}) {
  return (
    <div
      className="absolute rounded-[50%] bg-[#f4a15f]"
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: `${pos.width}%`,
        height: `${pos.height}%`,
        transformOrigin: "center",
        animation: `mascot-blink ${duration}s ease-in-out infinite`,
      }}
    />
  );
}

function Spark({ className, delay }: { className: string; delay: number }) {
  return (
    <span
      className={`absolute h-1.5 w-1.5 rounded-full bg-violet-300 ${className}`}
      style={{ animation: `mascot-spark 1.1s ease-in-out infinite`, animationDelay: `${delay}s` }}
    />
  );
}
