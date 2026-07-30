import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import { STAGES, StatusChip } from "../components/StatusChip";
import { CORAL, FONT_BODY, FONT_HEAD, INK_SOFT } from "../theme";

const RADIUS = 235;
const RING = 560;

type LoopCloseProps = {
  durationInFrames: number;
};

// Beat 7: the four status chips arrange into a cycle — the product's own
// status language drawing its closed loop.
export const LoopClose: React.FC<LoopCloseProps> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const exitP = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const circumference = 2 * Math.PI * (RADIUS - 4);
  const drawP = interpolate(frame, [4, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });

  const headline = (at: number): React.CSSProperties => ({
    opacity: interpolate(frame, [at - 12, at + 4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: `0px ${interpolate(frame, [at, at + 20], [24, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    })}px`,
  });

  // Chip angles: Claimed top, In review right, Approved bottom, Badge left.
  const angles = [-90, 0, 90, 180];

  return (
    <AbsoluteFill style={{ opacity: 1 - exitP }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        <div style={{ position: "relative", width: RING, height: RING }}>
          <svg
            width={RING}
            height={RING}
            style={{ position: "absolute", inset: 0, rotate: "-90deg" }}
          >
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS - 4}
              fill="none"
              stroke={CORAL}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - drawP)}
              opacity={0.55}
            />
          </svg>
          <Img
            src={staticFile("logo.png")}
            style={{
              position: "absolute",
              left: RING / 2 - 55,
              top: RING / 2 - 55,
              width: 110,
              height: 110,
              opacity: interpolate(frame, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
          {STAGES.map((stage, i) => {
            const at = 6 + i * 11;
            const rad = (angles[i] * Math.PI) / 180;
            const x = RING / 2 + RADIUS * Math.cos(rad);
            const y = RING / 2 + RADIUS * Math.sin(rad);
            const s = interpolate(frame, [at, at + 8, at + 14], [0.3, 1.12, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const o = interpolate(frame, [at, at + 7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={stage.label}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  translate: "-50% -50%",
                }}
              >
                <StatusChip stage={stage} scale={s} opacity={o} fontSize={31} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: INK_SOFT,
            ...headline(56),
          }}
        >
          Claim to badge, all in one place.
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 31,
            fontWeight: 500,
            color: "rgba(30,41,59,0.7)",
            marginTop: -18,
            ...headline(72),
          }}
        >
          Every badge is work an NGO signed off on.
        </div>
      </div>
    </AbsoluteFill>
  );
};
