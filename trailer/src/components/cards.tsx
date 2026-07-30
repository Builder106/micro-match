import React from "react";
import { QuarterArc } from "./QuarterArc";
import {
  CORAL,
  FONT_BODY,
  FONT_HEAD,
  INK_SOFT,
  SUCCESS,
  SURFACE,
  SURFACE_WARM,
} from "../theme";

export const CARD_W = 560;

const chip = (bg: string, color: string): React.CSSProperties => ({
  padding: "8px 18px",
  borderRadius: 999,
  backgroundColor: bg,
  color,
  fontSize: 21,
  fontWeight: 600,
  fontFamily: FONT_BODY,
  whiteSpace: "nowrap",
});

const cardShell: React.CSSProperties = {
  width: CARD_W,
  borderRadius: 26,
  padding: "36px 40px",
  boxShadow: "0 26px 60px rgba(15,23,42,0.12)",
  border: "1px solid rgba(15,23,42,0.06)",
  fontFamily: FONT_BODY,
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

// The NGO's side of the match: a real seed task, styled like the feed card.
export const NeedCard: React.FC = () => (
  <div style={{ ...cardShell, backgroundColor: SURFACE }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          backgroundColor: "#FFD9CF",
          color: CORAL,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        MSF
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK_SOFT }}>
          Doctors Without Borders
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: SUCCESS }}>
          ✓ Verified NGO
        </div>
      </div>
    </div>
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontSize: 33,
        fontWeight: 800,
        lineHeight: 1.22,
        color: INK_SOFT,
      }}
    >
      Translate a medical flyer into Spanish
    </div>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div style={chip("#FFE7E2", CORAL)}>⏱ 15 mins</div>
      <div style={chip("#F3E8FF", "#9333EA")}>#spanish</div>
      <div style={chip("#D1FAE5", "#059669")}>#health</div>
    </div>
  </div>
);

// The volunteer's side of the match: no profile UI exists for this in the
// product — this card is the trailer speaking to the viewer directly.
export const YouCard: React.FC = () => (
  <div style={{ ...cardShell, backgroundColor: SURFACE_WARM }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 54, height: 54 }}>
        <QuarterArc size={54} sweep={90} strokeWidth={6} id="youcard" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: INK_SOFT }}>You</div>
    </div>
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontSize: 33,
        fontWeight: 800,
        lineHeight: 1.22,
        color: INK_SOFT,
      }}
    >
      Fifteen minutes before your next class
    </div>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div style={chip("#FFE7E2", CORAL)}>speaks Spanish</div>
      <div style={chip("#E2E8F0", "#475569")}>has a laptop</div>
    </div>
  </div>
);

export type StreamTask = {
  title: string;
  minutes: number;
  tags: { label: string; bg: string; color: string }[];
};

// Compact feed-style card for the task stream.
export const StreamCard: React.FC<{
  task: StreamTask;
  claimed?: boolean;
  claimedPop?: number; // 0–1 pop progress of the Claimed stamp
}> = ({ task, claimed, claimedPop = 0 }) => (
  <div
    style={{
      width: 470,
      flexShrink: 0,
      borderRadius: 22,
      padding: "28px 32px",
      backgroundColor: SURFACE,
      boxShadow: "0 18px 44px rgba(15,23,42,0.10)",
      border: "1px solid rgba(15,23,42,0.06)",
      fontFamily: FONT_BODY,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative",
      scale: String(1 + 0.05 * claimedPop),
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: SUCCESS }}>
        ✓ Verified NGO
      </div>
      <div style={chip("#FFE7E2", CORAL)}>⏱ {task.minutes} mins</div>
    </div>
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontSize: 26,
        fontWeight: 800,
        lineHeight: 1.25,
        color: INK_SOFT,
      }}
    >
      {task.title}
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      {task.tags.map((t) => (
        <div key={t.label} style={{ ...chip(t.bg, t.color), fontSize: 18, padding: "6px 14px" }}>
          {t.label}
        </div>
      ))}
    </div>
    {claimed && (
      <div
        style={{
          position: "absolute",
          top: -18,
          right: -14,
          padding: "10px 22px",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${CORAL}, #fb923c)`,
          color: "#fff",
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 22,
          boxShadow: "0 12px 28px rgba(255,107,107,0.4)",
          opacity: claimedPop,
          scale: String(0.4 + 0.6 * claimedPop),
          rotate: "-4deg",
        }}
      >
        Claimed ✓
      </div>
    )}
  </div>
);
