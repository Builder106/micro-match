import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { QuarterArc } from "../components/QuarterArc";
import { FONT_HEAD, INK_SOFT } from "../theme";

export const LINE_FRAMES = [18, 78, 138];

const LINES = ["a coffee going cold.", "one bus stop.", "half a scroll."];

type Props = { durationInFrames: number };

// Beat 1 — the quarter hour. A clock face draws a 90° arc in three ticks
// while the copy reframes what fifteen idle minutes usually are.
export const QuarterHour: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 14], [0, 1], {
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

  // Arc ticks to 30/60/90 degrees, one tick per line.
  const sweep = interpolate(
    frame,
    [LINE_FRAMES[0], LINE_FRAMES[0] + 14, LINE_FRAMES[1], LINE_FRAMES[1] + 14, LINE_FRAMES[2], LINE_FRAMES[2] + 14],
    [0, 30, 30, 60, 60, 90],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.34, 1.2, 0.64, 1),
    },
  );

  // Continuous low-amplitude drift so holds never read as a stalled player.
  const drift = 1 + 0.018 * (frame / durationInFrames);

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 110,
          scale: String(drift * (1 - exit * 0.06)),
        }}
      >
        <QuarterArc size={480} sweep={sweep} strokeWidth={16} ticks id="b1" />
        <div style={{ width: 760, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: INK_SOFT,
              opacity: interpolate(frame, [6, 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Fifteen minutes is…
          </div>
          <div style={{ position: "relative", height: 110 }}>
            {LINES.map((text, i) => {
              const at = LINE_FRAMES[i];
              const next = LINE_FRAMES[i + 1];
              const fadeOut =
                next === undefined
                  ? 1
                  : interpolate(frame, [next - 8, next], [1, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
              const o =
                interpolate(frame, [at, at + 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }) * fadeOut;
              const y = interpolate(frame, [at, at + 14], [22, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              });
              return (
                <div
                  key={text}
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontFamily: FONT_HEAD,
                    fontSize: 74,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "rgba(30,41,59,0.55)",
                    opacity: o,
                    translate: `0px ${y}px`,
                  }}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
