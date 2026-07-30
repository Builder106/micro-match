import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { TaskCard } from "../components/TaskCard";
import { CORAL_GRADIENT, FONT_HEAD, INK_SOFT } from "../theme";

export const COLD_OPEN_CHIP_AT = 105;

const line = (
  frame: number,
  at: number,
): React.CSSProperties => ({
  opacity: interpolate(frame, [at, at + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  translate: `0px ${interpolate(frame, [at, at + 20], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })}px`,
});

type ColdOpenProps = {
  durationInFrames: number;
};

// Beat 1: hook lines left, the task card assembling right — the same
// text-left / card-right split as the site's own hero.
export const ColdOpen: React.FC<ColdOpenProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  // Exit: content converges toward the window slot as the feed beat fades in.
  const exitStart = durationInFrames - 22;
  const exitP = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exitP }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 90,
          padding: "0 110px",
          scale: String(1 - exitP * 0.45),
        }}
      >
        <div style={{ width: 660, display: "flex", flexDirection: "column", gap: 36 }}>
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.16,
              letterSpacing: "-0.02em",
              color: INK_SOFT,
              ...line(frame, 8),
            }}
          >
            Volunteering usually asks for your weekend.
          </div>
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.16,
              letterSpacing: "-0.02em",
              color: INK_SOFT,
              ...line(frame, 48),
            }}
          >
            This asks for{" "}
            <span
              style={{
                background: CORAL_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              fifteen minutes.
            </span>
          </div>
        </div>
        <TaskCard from={30} chipAt={COLD_OPEN_CHIP_AT} />
      </div>
    </AbsoluteFill>
  );
};
