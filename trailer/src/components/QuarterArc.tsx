import React from "react";
import { CORAL, ORANGE, OUTLINE } from "../theme";

type QuarterArcProps = {
  size: number;
  // Sweep of the coral arc in degrees, 0–90. 15 minutes is a quarter of
  // the clock face, so the arc never goes past 90 — that restraint IS
  // the motif.
  sweep: number;
  strokeWidth?: number;
  // Opacity of the faint full-circle track behind the arc.
  trackOpacity?: number;
  // Show the 12 tick marks of a clock face.
  ticks?: boolean;
  id?: string;
};

export const QuarterArc: React.FC<QuarterArcProps> = ({
  size,
  sweep,
  strokeWidth = 10,
  trackOpacity = 1,
  ticks = false,
  id = "qa",
}) => {
  const r = size / 2 - strokeWidth;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(90, sweep));
  const dash = (circumference * clamped) / 360;

  const tickEls: React.ReactNode[] = [];
  if (ticks) {
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      const inner = r - strokeWidth * 1.6;
      const outer = r - strokeWidth * 0.4;
      tickEls.push(
        <line
          key={i}
          x1={c + inner * Math.sin(a)}
          y1={c - inner * Math.cos(a)}
          x2={c + outer * Math.sin(a)}
          y2={c - outer * Math.cos(a)}
          stroke={OUTLINE}
          strokeWidth={i % 3 === 0 ? 4 : 2.5}
          strokeLinecap="round"
        />,
      );
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={CORAL} />
          <stop offset="100%" stopColor={ORANGE} />
        </linearGradient>
      </defs>
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={strokeWidth * 0.55}
        opacity={trackOpacity}
      />
      {tickEls}
      {clamped > 0 && (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${id}-grad)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          // Start the arc at 12 o'clock and sweep clockwise.
          transform={`rotate(-90 ${c} ${c})`}
        />
      )}
    </svg>
  );
};
