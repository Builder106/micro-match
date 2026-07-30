import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { QuarterArc } from "../components/QuarterArc";
import { CORAL, FONT_BODY, FONT_HEAD, INK_SOFT } from "../theme";

export const COIN_FRAMES = [45, 85, 125];

const COINS: { name: string; icon: React.ReactNode }[] = [
  {
    // "First Mission" is a real badge in the product's vault.
    name: "First Mission",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.6 6.2 6.4.5-4.9 4.3 1.5 6.5L12 16l-5.6 3.5 1.5-6.5L3 8.7l6.4-.5L12 2z"
          fill="#fff"
        />
      </svg>
    ),
  },
  {
    name: "Translator",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 5h8M8 3v2m2.5 12L8 9l-2.5 8M6.2 15h3.6M13 19h7m-6-3.5L17 8l3 7.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Archivist",
    icon: (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="5" rx="1.5" fill="#fff" />
        <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="#fff" strokeWidth="2" />
        <path d="M10 14.5h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

type Props = { durationInFrames: number };

// Beat 5 — the record. Badge coins mint one by one, each rimmed with the
// quarter-hour arc. No counts, no levels — just what a badge IS here:
// work an NGO signed off on.
export const TheRecord: React.FC<Props> = ({ durationInFrames }) => {
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
  const drift = 1 + 0.016 * (frame / durationInFrames);

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
          gap: 64,
          scale: String(drift),
        }}
      >
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 66,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: INK_SOFT,
            opacity: interpolate(frame, [8, 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Your minutes leave a record.
        </div>

        <div style={{ display: "flex", gap: 90 }}>
          {COINS.map((coin, i) => {
            const at = COIN_FRAMES[i];
            const o = interpolate(frame, [at, at + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const s = interpolate(frame, [at, at + 10, at + 18], [1.7, 0.95, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.34, 1.2, 0.64, 1),
            });
            const ping = interpolate(frame, [at + 6, at + 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={coin.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 26,
                  opacity: o,
                  scale: String(s),
                }}
              >
                <div style={{ position: "relative", width: 236, height: 236 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 236 + ping * 130,
                      height: 236 + ping * 130,
                      translate: "-50% -50%",
                      borderRadius: "50%",
                      border: `3px solid ${CORAL}`,
                      opacity: ping > 0 ? (1 - ping) * 0.7 : 0,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 18,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${CORAL}, #fb923c)`,
                      boxShadow: "0 22px 50px rgba(255,107,107,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {coin.icon}
                  </div>
                  <div style={{ position: "absolute", inset: 0 }}>
                    <QuarterArc
                      size={236}
                      sweep={90}
                      strokeWidth={8}
                      trackOpacity={0.5}
                      id={`coin-${i}`}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_HEAD,
                    fontSize: 30,
                    fontWeight: 700,
                    color: INK_SOFT,
                  }}
                >
                  {coin.name}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 33,
            fontWeight: 500,
            color: "rgba(30,41,59,0.65)",
            opacity: interpolate(frame, [COIN_FRAMES[2] + 40, COIN_FRAMES[2] + 58], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Every badge is work an NGO signed off on.
        </div>
      </div>
    </AbsoluteFill>
  );
};
