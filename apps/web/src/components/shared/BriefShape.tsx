"use client";

import { useMemo } from "react";

interface BriefShapeProps {
  briefId: string;
  className?: string;
}

export function BriefShape({ briefId, className = "w-5 h-5" }: BriefShapeProps) {
  const shapeIndex = useMemo(() => {
    if (!briefId) return 0;
    let hash = 0;
    for (let i = 0; i < briefId.length; i++) {
      hash = briefId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 7;
  }, [briefId]);

  switch (shapeIndex) {
    case 0: // Diamond
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="1" transform="rotate(45 12 12)" />
        </svg>
      );
    case 1: // Triangle
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="12,5 4,19 20,19" />
        </svg>
      );
    case 2: // Hexagon
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5" />
        </svg>
      );
    case 3: // Pentagon
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="12,3 21,9.5 17.5,20 6.5,20 3,9.5" />
        </svg>
      );
    case 4: // Star
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
      );
    case 5: // Circle
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case 6: // Octagon
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="8.5,3 15.5,3 21,8.5 21,15.5 15.5,21 8.5,21 3,15.5 3,8.5" />
        </svg>
      );
  }
}
