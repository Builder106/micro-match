import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";
import { FONT_BODY, INK } from "../theme";
import { STAGES, StatusChip } from "./StatusChip";

type StatusDockProps = {
  // Local frames (within the dock's Sequence) at which each stage stamps.
  stampFrames: [number, number, number, number];
  exitFrame: number;
};

// Mini task card docked bottom-left across the four loop beats.
// Each completed stage stamps a status chip onto it.
export const StatusDock: React.FC<StatusDockProps> = ({
  stampFrames,
  exitFrame,
}) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit = interpolate(frame, [exitFrame - 14, exitFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.7, 0, 0.84, 0),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        bottom: 28,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 22px 12px 14px",
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 14px 34px rgba(15,23,42,0.14)",
        opacity: enter * exit,
        translate: `0px ${(1 - enter) * 40}px`,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{ width: 42, height: 42, borderRadius: 12 }}
      />
      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 21,
          fontWeight: 600,
          color: INK,
          maxWidth: 340,
        }}
      >
        Translate a medical flyer into Spanish
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {STAGES.map((stage, i) => {
          const at = stampFrames[i];
          if (frame < at) {
            return null;
          }
          const pop = interpolate(frame, [at, at + 7, at + 13], [0.3, 1.14, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fade = interpolate(frame, [at, at + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <StatusChip key={stage.label} stage={stage} scale={pop} opacity={fade} />
          );
        })}
      </div>
    </div>
  );
};
