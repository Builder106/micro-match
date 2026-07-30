import React from "react";
import {
  FONT_BODY,
  INK,
  WINDOW_CHROME_H,
  WINDOW_LEFT,
  WINDOW_TOP,
  WINDOW_VIDEO_H,
  WINDOW_W,
} from "../theme";

type AppWindowProps = {
  children: React.ReactNode;
  opacity?: number;
  translateY?: number;
  // Push-in applied to the video content only, so the chrome stays crisp.
  contentScale?: number;
  contentOrigin?: string;
};

// Browser-style frame all real-footage beats share.
export const AppWindow: React.FC<AppWindowProps> = ({
  children,
  opacity = 1,
  translateY = 0,
  contentScale = 1,
  contentOrigin = "50% 50%",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: WINDOW_LEFT,
        top: WINDOW_TOP,
        width: WINDOW_W,
        height: WINDOW_CHROME_H + WINDOW_VIDEO_H,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow:
          "0 30px 70px rgba(15,23,42,0.16), 0 4px 14px rgba(15,23,42,0.08)",
        border: "1px solid rgba(15,23,42,0.08)",
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <div
        style={{
          height: WINDOW_CHROME_H,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 20px",
          backgroundColor: "#F6F4EE",
          borderBottom: "1px solid rgba(15,23,42,0.07)",
        }}
      >
        {["#FF6B6B", "#FBBF24", "#34D399"].map((c) => (
          <div
            key={c}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: c,
              opacity: 0.9,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 16,
            padding: "5px 18px",
            borderRadius: 999,
            backgroundColor: "rgba(15,23,42,0.05)",
            fontFamily: FONT_BODY,
            fontSize: 17,
            fontWeight: 500,
            color: INK,
            opacity: 0.7,
          }}
        >
          trymicromatch.vercel.app
        </div>
      </div>
      <div
        style={{
          width: WINDOW_W,
          height: WINDOW_VIDEO_H,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            scale: String(contentScale),
            transformOrigin: contentOrigin,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
