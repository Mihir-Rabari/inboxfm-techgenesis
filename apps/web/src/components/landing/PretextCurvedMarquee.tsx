"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "framer-motion";

interface SegmentItem {
  char: string;
  width: number;
  cumulativeWidth: number;
}

export function PretextCurvedMarquee() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1400);
  const [repeatedSegments, setRepeatedSegments] = useState<SegmentItem[]>([]);
  const [totalTextWidth, setTotalTextWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const scrollOffsetRef = useRef(0);

  // Initialize and measure text using Canvas context on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }

      try {
        const font = "bold 14px ui-monospace, monospace";
        // Product context based text
        const text = "transforming email newsletters, client threads, deadlines, and project updates into a concise daily spoken narrative briefing  ●  reclaim your focus  ●  inbox fm  ●  ";
        
        // Split character by character
        const rawSegments = text.split("");
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context is unavailable");
        ctx.font = font;

        const segmentsList: SegmentItem[] = [];
        let cumulativeWidth = 0;

        // Repeat the text 4 times to ensure it covers the path and loops seamlessly
        for (let r = 0; r < 4; r++) {
          for (let i = 0; i < rawSegments.length; i++) {
            const segText = rawSegments[i];
            const measuredWidth = ctx.measureText(segText).width;

            segmentsList.push({
              char: segText === " " ? "\u00A0" : segText, // Convert regular spaces to non-breaking spaces
              width: measuredWidth,
              cumulativeWidth,
            });
            // Increments offset by character width with kerning padding to increase spacing between characters
            cumulativeWidth += measuredWidth + 2.25;
          }
        }

        setRepeatedSegments(segmentsList);
        setTotalTextWidth(cumulativeWidth);
      } catch {
        console.error("Character-based curved marquee initialization failed");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Track the actual width of the container dynamically to handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
          if (typeof window !== "undefined") {
            setIsMobile(window.innerWidth < 768);
          }
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Frame animation loop updating DOM style properties directly for smooth performance
  useAnimationFrame((time, delta) => {
    if (!pathRef.current || !isMounted || repeatedSegments.length === 0 || totalTextWidth === 0) return;

    let pathLength = 0;
    try {
      pathLength = pathRef.current.getTotalLength();
    } catch {
      // Fallback if path element measurements are briefly unavailable
    }
    if (pathLength === 0) return;

    const scale = containerWidth / 1400;
    const charScale = scale; // Let character scale match coordinate scale exactly to avoid bunching

    // Scrolling speed: pixels per millisecond
    const speed = 0.055;
    scrollOffsetRef.current = (scrollOffsetRef.current + delta * speed) % totalTextWidth;

    repeatedSegments.forEach((seg, idx) => {
      const el = charRefs.current[idx];
      if (!el) return;

      // Calculate position along the path (modulo total text width for infinite looping)
      const rawDistance = (seg.cumulativeWidth - scrollOffsetRef.current + totalTextWidth) % totalTextWidth;

      // Only show and animate characters that fall within the path boundaries
      if (rawDistance >= 0 && rawDistance <= pathLength) {
        const p = pathRef.current!.getPointAtLength(rawDistance);
        
        // Find tangent vector for rotation
        const nextDist = Math.min(pathLength, rawDistance + 1);
        const pNext = pathRef.current!.getPointAtLength(nextDist);
        const dx = pNext.x - p.x;
        const dy = pNext.y - p.y;
        const angle = Math.atan2(dy, dx);

        const tx = p.x * scale;
        const ty = p.y * scale;

        el.style.display = "block";
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) rotate(${angle}rad) scale(${charScale})`;
      } else {
        el.style.display = "none";
      }
    });
  });

  return (
    <div ref={containerRef} className="relative w-full min-w-[1400px] md:min-w-0 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 select-none pointer-events-none" style={{ minHeight: isMobile ? "160px" : "80px" }}>
      
      {/* SVG Curved Backdrop Ribbon */}
      <svg viewBox="0 0 1400 160" className="w-full h-auto overflow-visible" aria-hidden="true">
        <path
          ref={pathRef}
          d="M -50,145 C 300,100 600,170 1000,80 C 1200,50 1350,90 1450,40"
          fill="none"
          className="stroke-[#0e0e0e] dark:stroke-white"
          strokeWidth={isMobile ? 56 : 28}
          strokeLinecap="round"
        />
      </svg>

      {/* Absolutely positioned character rendering layer */}
      {isMounted && repeatedSegments.length > 0 && (
        <div className="absolute inset-0 pointer-events-none select-none font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-white dark:text-black">
          {repeatedSegments.map((seg, idx) => (
            <span
              key={idx}
              ref={(el) => {
                charRefs.current[idx] = el;
              }}
              className="absolute left-0 top-0 will-change-transform font-bold"
              style={{ display: "none", transformOrigin: "center center", whiteSpace: "pre" }}
            >
              {seg.char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
