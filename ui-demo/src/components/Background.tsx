import React from "react";
import { AbsoluteFill } from "remotion";
import { CREAM } from "../theme";

// Solid cream base with the site's hero-glow: soft coral/yellow blobs.
// Always rendered at full opacity so scene exits never fade to encoder black.
export const Background: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 700,
          left: -180,
          top: -220,
          background:
            "radial-gradient(ellipse at center, rgba(253,224,71,0.16), rgba(253,224,71,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 800,
          right: -240,
          bottom: -280,
          background:
            "radial-gradient(ellipse at center, rgba(255,107,107,0.13), rgba(255,107,107,0) 70%)",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};
