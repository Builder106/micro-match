import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import {
  CORAL,
  CORAL_GRADIENT,
  FONT_BODY,
  FONT_HEAD,
  INK_SOFT,
} from "../theme";

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

// Beat 8: Blender laptop sway + hero line + URL + FOSS invite.
export const Endcard: React.FC = () => {
  const frame = useCurrentFrame();

  // 60-frame sway loop cycled at half speed, per the laptop pipeline.
  const laptopFrame = (Math.floor(frame / 2) % 60) + 1;
  const padded = String(laptopFrame).padStart(4, "0");

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          padding: "0 90px",
        }}
      >
        <div
          style={{
            width: 700,
            display: "flex",
            flexDirection: "column",
            gap: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              ...reveal(frame, 0),
            }}
          >
            <Img
              src={staticFile("logo.png")}
              style={{ width: 84, height: 84 }}
            />
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
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: INK_SOFT,
              ...reveal(frame, 14),
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

          <div style={{ display: "flex", ...reveal(frame, 30) }}>
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
              fontSize: 27,
              fontWeight: 500,
              color: "rgba(30,41,59,0.65)",
              ...reveal(frame, 44),
            }}
          >
            Free &amp; open source · github.com/Builder106/MicroMatch
          </div>
        </div>

        <div
          style={{
            width: 1020,
            display: "flex",
            justifyContent: "center",
            opacity: interpolate(frame, [4, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <Img
            src={staticFile(`mm_laptop_${padded}.png`)}
            style={{ width: 1020 }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
