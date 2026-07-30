import React from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { Video } from "@remotion/media";
import { AppWindow } from "../components/AppWindow";
import { CORAL, FONT_BODY } from "../theme";

type FootageBeatProps = {
  src: string;
  trimStartSec: number;
  durationInFrames: number;
  // Fade the window in on entry (first beat of a footage run).
  enter?: boolean;
  // Fade the window out at the end (last beat of a footage run).
  exit?: boolean;
  // Navigation-style push: the previous footage slides out left while this
  // beat's footage slides in from the right, inside the same window.
  prevSrc?: string;
  prevTrimStartSec?: number;
  slideFrames?: number;
  caption?: string;
  captionFrom?: number;
  captionUntil?: number;
  captionBottom?: number;
  pushScale?: number;
  pushOrigin?: string;
  pushFrom?: number;
  // Frames over which the push eases in and then holds. Omit to ramp across
  // the whole beat (previous behaviour).
  pushSettleFrames?: number;
  // Extra scale added linearly after the settle, so a held money shot keeps a
  // slow drift instead of reading as a frozen frame.
  pushCreep?: number;
  // The same idea before the push starts. When pushFrom is late and the
  // underlying footage is static, frames 0..pushFrom have no motion at all
  // and freezedetect flags them. Ramps in over the pre-push window and then
  // holds, so it offsets the push rather than fighting it.
  preDrift?: number;
  // Coral glow accent locked to a UI element inside the (zoomed) footage —
  // used to give the badge-mint beat the payoff the raw footage lacks.
  glow?: boolean;
  glowX?: number;
  glowY?: number;
  glowFrom?: number;
};

const fullSize: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

// One real-footage beat inside the shared app window.
export const FootageBeat: React.FC<FootageBeatProps> = ({
  src,
  trimStartSec,
  durationInFrames,
  enter = false,
  exit = false,
  prevSrc,
  prevTrimStartSec = 0,
  slideFrames = 14,
  caption,
  captionFrom = 20,
  captionUntil,
  captionBottom = 152,
  pushScale = 1.035,
  pushOrigin = "50% 50%",
  pushFrom = 0,
  pushSettleFrames,
  pushCreep = 0,
  preDrift = 0,
  glow = false,
  glowX = 34,
  glowY = 84,
  glowFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterO = enter
    ? interpolate(frame, [0, 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const exitO = exit
    ? interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const enterY = enter
    ? interpolate(frame, [0, 18], [34, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 0;

  // Push eases in and, when pushSettleFrames is given, settles well before the
  // beat ends so the zoomed frame holds instead of ramping into the exit fade.
  const pushEnd = pushSettleFrames
    ? pushFrom + pushSettleFrames
    : durationInFrames;
  const baseScale = interpolate(frame, [pushFrom, pushEnd], [1, pushScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // Slow drift after the settle keeps the held frame alive (avoids a freeze).
  const creep = pushCreep
    ? interpolate(frame, [pushEnd, durationInFrames], [0, pushCreep], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  // Same, before the push starts, for beats that open on static footage.
  const pre =
    preDrift && pushFrom > 0
      ? interpolate(frame, [0, pushFrom], [0, preDrift], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const scale = baseScale + creep + pre;

  // Coral glow bloom + one-shot ring ping on the badge mint.
  const glowO = glow
    ? interpolate(
        frame,
        [glowFrom, glowFrom + 14, durationInFrames - 14, durationInFrames],
        [0, 1, 1, 0.6],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  const glowPulse = glow
    ? interpolate(
        frame,
        [glowFrom, glowFrom + 10, glowFrom + 28],
        [0.62, 1.16, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        },
      )
    : 1;
  const pingP = interpolate(frame, [glowFrom, glowFrom + 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pingO = interpolate(
    frame,
    [glowFrom, glowFrom + 6, glowFrom + 36],
    [0, 0.65, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Slide progress for the navigation push (1 immediately when no prevSrc).
  const slideP = prevSrc
    ? interpolate(frame, [0, slideFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      })
    : 1;

  const capUntil = captionUntil ?? durationInFrames - 30;
  const capO = caption
    ? interpolate(
        frame,
        [captionFrom, captionFrom + 12, capUntil, capUntil + 12],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 0;
  const capY = caption
    ? interpolate(frame, [captionFrom, captionFrom + 16], [20, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 0;

  return (
    <AbsoluteFill>
      <AppWindow
        opacity={enterO * exitO}
        translateY={enterY}
        contentScale={scale}
        contentOrigin={pushOrigin}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {prevSrc && slideP < 1 ? (
            <Video
              src={staticFile(prevSrc)}
              trimBefore={Math.round(prevTrimStartSec * fps)}
              muted
              style={{
                ...fullSize,
                translate: `${-30 * slideP}% 0%`,
              }}
            />
          ) : null}
          <Video
            src={staticFile(src)}
            trimBefore={Math.round(trimStartSec * fps)}
            muted
            style={{
              ...fullSize,
              translate: `${100 * (1 - slideP)}% 0%`,
              boxShadow:
                slideP < 1 ? "-30px 0 60px rgba(15,23,42,0.18)" : "none",
            }}
          />
          {glow ? (
            <div
              style={{
                position: "absolute",
                left: `${glowX}%`,
                top: `${glowY}%`,
                translate: "-50% -50%",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 480,
                  height: 320,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at center, rgba(255,107,107,0.42) 0%, rgba(251,146,60,0.26) 34%, rgba(255,107,107,0) 72%)",
                  opacity: glowO,
                  scale: String(glowPulse),
                  filter: "blur(4px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  translate: "-50% -50%",
                  width: 170,
                  height: 170,
                  borderRadius: "50%",
                  border: `3px solid ${CORAL}`,
                  opacity: pingO,
                  scale: String(0.6 + pingP * 2.0),
                }}
              />
            </div>
          ) : null}
        </div>
      </AppWindow>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: captionBottom,
            display: "flex",
            justifyContent: "center",
            opacity: capO,
            translate: `0px ${capY}px`,
          }}
        >
          <div
            style={{
              padding: "16px 34px",
              borderRadius: 999,
              backgroundColor: "rgba(15,23,42,0.86)",
              color: "#fff",
              fontFamily: FONT_BODY,
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            {caption}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
