"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type MascotMood = "curious" | "thinking" | "happy" | "excited";

interface MascotProps {
  mood: MascotMood;
}

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
      setTiltDeg(Math.max(-8, Math.min(8, dx * 20)));
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  function handlePoke() {
    setPoked(true);
    setTimeout(() => setPoked(false), 400);
  }

  const waveSpeed = mood === "excited" ? 0.8 : mood === "thinking" ? 2.6 : 1.8;

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      onClick={handlePoke}
      style={{
        transform: `rotate(${tiltDeg}deg) scale(${poked ? 1.12 : 1})`,
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {mood === "excited" && (
        <>
          <Spark className="-top-2 -left-3" delay={0} />
          <Spark className="-top-3 right-0" delay={0.35} />
          <Spark className="top-1 -right-4" delay={0.7} />
        </>
      )}

      <div
        className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-violet-500/50 shadow-[0_0_24px_rgba(139,92,246,0.35)]"
        style={{
          animation: `mascot-float 3s ease-in-out infinite, mascot-wave ${waveSpeed}s ease-in-out infinite`,
        }}
      >
        <Image
          src="/receptionist-cropped.png"
          alt="Your Oviflow AI receptionist"
          fill
          sizes="96px"
          className="object-cover object-top"
          priority
        />
      </div>
    </div>
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
