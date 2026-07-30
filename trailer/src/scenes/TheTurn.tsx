import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { QuarterArc } from "../components/QuarterArc";
import { CORAL_GRADIENT, FONT_HEAD, INK_SOFT } from "../theme";

type Props = { durationInFrames: number };

// Beat 2 — the turn. Same arc, now full and pulsing; the copy flips the
// framing from idle time to usable time.
export const TheTurn: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );

  // Gentle breathing pulse on the arc — continuous motion for the hold.
  const pulse = 1 + 0.035 * Math.sin((frame / 30) * Math.PI * 0.9);
  const glowO = interpolate(frame, [10, 50], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = 1 + 0.015 * (frame / durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 900,
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          background:
            "radial-gradient(ellipse at center, rgba(255,107,107,0.16), rgba(255,107,107,0) 65%)",
          filter: "blur(30px)",
          opacity: glowO,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          scale: String(drift),
        }}
      >
        <div style={{ scale: String(pulse) }}>
          <QuarterArc size={230} sweep={90} strokeWidth={13} id="b2" />
        </div>
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.16,
            color: INK_SOFT,
            textAlign: "center",
            maxWidth: 1300,
            opacity: interpolate(frame, [14, 32], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${interpolate(frame, [14, 36], [26, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px`,
          }}
        >
          It&rsquo;s also enough to{" "}
          <span
            style={{
              background: CORAL_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            help someone.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
