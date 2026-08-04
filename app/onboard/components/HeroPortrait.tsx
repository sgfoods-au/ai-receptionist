"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Eye positions as percentages of the SOURCE image (1536x1024), measured
// and verified against the actual art via composited test renders.
const IMAGE_W = 1536;
const IMAGE_H = 1024;
const LEFT_EYE = { left: 27, top: 30.5, width: 6, height: 6 };
const RIGHT_EYE = { left: 35.8, top: 26, width: 5.3, height: 6.5 };

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Static hero portrait for the onboarding split-screen layout, rendered
 * full-bleed (object-fit: cover). The only motion is a periodic eye blink.
 *
 * The eyelid overlays are positioned in source-image percentage space, then
 * converted at runtime to container percentages accounting for the actual
 * "cover" crop — object-fit: cover alone would desync the overlays from a
 * flat percentage-of-container position whenever the container's aspect
 * ratio doesn't match the source image's.
 */
export function HeroPortrait() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<{ left: Rect; right: Rect } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function toContainerPct(eye: typeof LEFT_EYE, cw: number, ch: number): Rect {
      // object-fit: contain — the whole image always fits, letterboxed with
      // the matching cream background color, so she's never cropped even
      // when the panel's aspect ratio is very different from the source
      // image's (e.g. a tall, narrow full-height column on wide viewports).
      const scale = Math.min(cw / IMAGE_W, ch / IMAGE_H);
      const renderedW = IMAGE_W * scale;
      const renderedH = IMAGE_H * scale;
      const offsetX = (cw - renderedW) / 2;
      const offsetY = (ch - renderedH) / 2;

      const pxLeft = offsetX + (eye.left / 100) * renderedW;
      const pxTop = offsetY + (eye.top / 100) * renderedH;
      const pxWidth = (eye.width / 100) * renderedW;
      const pxHeight = (eye.height / 100) * renderedH;

      return {
        left: (pxLeft / cw) * 100,
        top: (pxTop / ch) * 100,
        width: (pxWidth / cw) * 100,
        height: (pxHeight / ch) * 100,
      };
    }

    function recompute() {
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setRects({
        left: toContainerPct(LEFT_EYE, width, height),
        right: toContainerPct(RIGHT_EYE, width, height),
      });
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <Image
        src="/receptionist-hero.png"
        alt="Your Oviflow AI receptionist"
        fill
        sizes="(min-width: 768px) 45vw, 100vw"
        className="object-contain"
        priority
      />
      {rects && (
        <>
          <Eyelid pos={rects.left} />
          <Eyelid pos={rects.right} />
        </>
      )}
    </div>
  );
}

function Eyelid({ pos }: { pos: Rect }) {
  return (
    <div
      className="absolute rounded-[50%] bg-[#f4a15f]"
      style={{
        left: `${pos.left}%`,
        top: `${pos.top}%`,
        width: `${pos.width}%`,
        height: `${pos.height}%`,
        transformOrigin: "center",
        animation: "mascot-blink 4.5s ease-in-out infinite",
      }}
    />
  );
}
