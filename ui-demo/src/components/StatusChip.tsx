import React from "react";
import { CORAL_GRADIENT, FONT_BODY } from "../theme";

export type Stage = {
  label: string;
  bg: string;
  color: string;
  filled?: boolean;
};

// The four lifecycle stages, in product tag-chip styling.
export const STAGES: Stage[] = [
  { label: "Claimed", bg: "#DBEAFE", color: "#2563EB" },
  { label: "In review", bg: "#FEF3C7", color: "#B45309" },
  { label: "Approved", bg: "#D1FAE5", color: "#059669" },
  { label: "Badge minted", bg: CORAL_GRADIENT, color: "#fff", filled: true },
];

type StatusChipProps = {
  stage: Stage;
  scale?: number;
  opacity?: number;
  fontSize?: number;
};

export const StatusChip: React.FC<StatusChipProps> = ({
  stage,
  scale = 1,
  opacity = 1,
  fontSize = 19,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `${fontSize * 0.38}px ${fontSize * 0.95}px`,
        borderRadius: 999,
        background: stage.bg,
        color: stage.color,
        fontFamily: FONT_BODY,
        fontSize,
        fontWeight: 600,
        whiteSpace: "nowrap",
        scale: String(scale),
        opacity,
        boxShadow: stage.filled ? "0 4px 14px rgba(255,107,107,0.35)" : "none",
      }}
    >
      {stage.label}
    </div>
  );
};
