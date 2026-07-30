import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NeedCard, YouCard } from "../components/cards";
import { CORAL, FONT_BODY, FONT_HEAD, INK_SOFT } from "../theme";

// Local frames the composition aligns SFX to.
export const MATCH_SLIDE_AT = 15;
export const MATCH_CONTACT_AT = 140;
export const MATCH_WORDMARK_AT = 165;

type Props = { durationInFrames: number };

// Beat 3 — the match. The name enacted: an NGO's need and a volunteer's
// quarter hour slide together and click; the wordmark assembles from the
// two halves.
export const TheMatch: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );

  // Phase 1: slide in from far off-screen to resting slots.
  const slideIn = spring({
    frame: frame - MATCH_SLIDE_AT,
    fps,
    config: { stiffness: 60, damping: 16, mass: 1 },
    durationInFrames: 55,
  });
  // Phase 2: close the gap until the cards touch.
  const close = spring({
    frame: frame - (MATCH_CONTACT_AT - 30),
    fps,
    config: { stiffness: 90, damping: 15, mass: 0.9 },
    durationInFrames: 35,
  });

  // Resting slots ±360, contact at ±282 (half card width + hairline).
  const rest = interpolate(slideIn, [0, 1], [1250, 360]);
  const gapX = interpolate(close, [0, 1], [rest, 282]);

  // Contact ring burst.
  const burst = interpolate(frame, [MATCH_CONTACT_AT, MATCH_CONTACT_AT + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Wordmark: the two halves fly in from their cards and join.
  const wm = spring({
    frame: frame - MATCH_WORDMARK_AT,
    fps,
    config: { stiffness: 80, damping: 16, mass: 0.9 },
    durationInFrames: 40,
  });
  const wmOffset = interpolate(wm, [0, 1], [190, 0]);
  const wmO = interpolate(frame, [MATCH_WORDMARK_AT, MATCH_WORDMARK_AT + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const captionO = interpolate(frame, [MATCH_WORDMARK_AT + 55, MATCH_WORDMARK_AT + 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Post-click settle-and-hold: slow drift so the held frame never freezes.
  const drift =
    1 +
    0.02 *
      interpolate(frame, [MATCH_CONTACT_AT, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 70,
          scale: String(drift),
        }}
      >
        <div style={{ position: "relative", height: 320, width: "100%" }}>
          {/* Contact burst */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 60 + burst * 560,
              height: 60 + burst * 560,
              translate: "-50% -50%",
              borderRadius: "50%",
              border: `4px solid ${CORAL}`,
              opacity: burst > 0 ? (1 - burst) * 0.8 : 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              translate: `calc(-50% - ${gapX}px) -50%`,
              rotate: `${-1.2 * (1 - close * 0.4)}deg`,
            }}
          >
            <NeedCard />
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              translate: `calc(-50% + ${gapX}px) -50%`,
              rotate: `${1.2 * (1 - close * 0.4)}deg`,
            }}
          >
            <YouCard />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: FONT_HEAD,
            fontSize: 108,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            opacity: wmO,
          }}
        >
          <span style={{ color: CORAL, translate: `${-wmOffset}px 0px` }}>
            Micro
          </span>
          <span style={{ color: INK_SOFT, translate: `${wmOffset}px 0px` }}>
            Match
          </span>
        </div>

        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 33,
            fontWeight: 500,
            color: "rgba(30,41,59,0.65)",
            opacity: captionO,
          }}
        >
          A need, met in minutes you already have.
        </div>
      </div>
    </AbsoluteFill>
  );
};
