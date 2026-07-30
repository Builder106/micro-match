import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { QuarterArc } from "../components/QuarterArc";
import {
  CORAL,
  CORAL_GRADIENT,
  FONT_BODY,
  FONT_HEAD,
  INK_SOFT,
} from "../theme";

export const QUESTION_UNTIL = 120;
export const URL_PILL_AT = QUESTION_UNTIL + 42;

const reveal = (frame: number, at: number): React.CSSProperties => ({
  opacity: interpolate(frame, [at, at + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  translate: `0px ${interpolate(frame, [at, at + 20], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  })}px`,
});

type Props = { durationInFrames: number };

// Beat 6 — the invitation. The question the whole video has been asking,
// then the brand close: laptop, URL, and the FOSS invite.
export const Invitation: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 1 — the question.
  const qExit = interpolate(frame, [QUESTION_UNTIL - 18, QUESTION_UNTIL], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const qDrift = 1 + 0.02 * (frame / QUESTION_UNTIL);
  const qSweep = interpolate(frame, [8, 46], [0, 90], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Phase 2 — endcard.
  const e = (at: number) => reveal(frame, QUESTION_UNTIL - 8 + at);
  const laptopFrame = (Math.floor(frame / 2) % 60) + 1;
  const padded = String(laptopFrame).padStart(4, "0");
  const endDrift =
    1 +
    0.012 *
      interpolate(frame, [QUESTION_UNTIL, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      {frame < QUESTION_UNTIL && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            opacity: 1 - qExit,
            scale: String(qDrift),
          }}
        >
          <QuarterArc size={190} sweep={qSweep} strokeWidth={12} id="b6" />
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: INK_SOFT,
              ...reveal(frame, 10),
            }}
          >
            Got fifteen{" "}
            <span
              style={{
                background: CORAL_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              minutes?
            </span>
          </div>
        </div>
      )}

      {frame >= QUESTION_UNTIL - 8 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            padding: "0 90px",
            scale: String(endDrift),
          }}
        >
          <div style={{ width: 720, display: "flex", flexDirection: "column", gap: 34 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, ...e(0) }}>
              <Img src={staticFile("logo.png")} style={{ width: 84, height: 84 }} />
              <div
                style={{
                  fontFamily: FONT_HEAD,
                  fontSize: 54,
                  fontWeight: 800,
                  color: CORAL,
                }}
              >
                MicroMatch
              </div>
            </div>

            <div
              style={{
                fontFamily: FONT_HEAD,
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.14,
                letterSpacing: "-0.02em",
                color: INK_SOFT,
                ...e(14),
              }}
            >
              Make a big impact in
              <br />
              <span
                style={{
                  background: CORAL_GRADIENT,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                a few minutes.
              </span>
            </div>

            <div style={{ display: "flex", ...e(34) }}>
              <div
                style={{
                  padding: "18px 40px",
                  borderRadius: 999,
                  background: CORAL_GRADIENT,
                  color: "#fff",
                  fontFamily: FONT_BODY,
                  fontSize: 34,
                  fontWeight: 700,
                  boxShadow: "0 14px 34px rgba(255,107,107,0.35)",
                }}
              >
                trymicromatch.vercel.app
              </div>
            </div>

            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 26,
                fontWeight: 500,
                lineHeight: 1.5,
                color: "rgba(30,41,59,0.65)",
                ...e(48),
              }}
            >
              Free &amp; open source — use it, or build it with us.
              <br />
              github.com/Builder106/MicroMatch
            </div>
          </div>

          <div
            style={{
              width: 1000,
              display: "flex",
              justifyContent: "center",
              opacity: interpolate(
                frame,
                [QUESTION_UNTIL - 4, QUESTION_UNTIL + 14],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
            }}
          >
            <Img
              src={staticFile(`mm_laptop_${padded}.png`)}
              style={{ width: 1000 }}
            />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
