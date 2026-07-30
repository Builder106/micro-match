import React from "react";
import { AbsoluteFill } from "remotion";
import { CREAM } from "../theme";

// Solid cream base with the site's hero-glow blobs. Rendered at full
// opacity for the whole video so scene exits never composite over
// encoder black — scenes fade their inner wrappers, never this.
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
