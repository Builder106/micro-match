import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { StreamCard, StreamTask } from "../components/cards";
import { FONT_BODY, FONT_HEAD, INK_SOFT } from "../theme";

export const STREAM_CLAIM_AT = 150;

const TAG = {
  translation: { label: "#translation", bg: "#DBEAFE", color: "#2563EB" },
  spanish: { label: "#spanish", bg: "#F3E8FF", color: "#9333EA" },
  health: { label: "#health", bg: "#D1FAE5", color: "#059669" },
  data: { label: "#data", bg: "#DBEAFE", color: "#2563EB" },
  history: { label: "#history", bg: "#FEF3C7", color: "#B45309" },
  design: { label: "#design", bg: "#F3E8FF", color: "#9333EA" },
  environment: { label: "#environment", bg: "#D1FAE5", color: "#059669" },
  excel: { label: "#excel", bg: "#D1FAE5", color: "#059669" },
};

// The eight evergreen tasks from scripts/seed.ts — real product inventory,
// real durations, no invented listings.
const ROW_A: StreamTask[] = [
  { title: "Translate a medical flyer into Spanish", minutes: 15, tags: [TAG.translation, TAG.health] },
  { title: "Draft three social-post captions for an event", minutes: 10, tags: [TAG.design] },
  { title: "Categorize community Q&A entries", minutes: 15, tags: [TAG.data] },
  { title: "Build a beginner Excel formula reference", minutes: 20, tags: [TAG.data, TAG.excel] },
];
const ROW_B: StreamTask[] = [
  { title: "Tag historical photos for an archive", minutes: 5, tags: [TAG.data, TAG.history] },
  { title: "Audit alt-text on a learning resource", minutes: 20, tags: [TAG.design] },
  { title: "Proofread a plain-language climate explainer", minutes: 25, tags: [TAG.environment] },
  { title: "Translate a volunteer welcome email to Spanish", minutes: 10, tags: [TAG.translation, TAG.spanish] },
];
// Index of the card in ROW_B that visibly gets claimed mid-beat.
const CLAIMED_INDEX = 2;

const CARD_SPAN = 470 + 44; // card width + row gap

type Props = { durationInFrames: number };

// Beat 4 — the stream. The real seed inventory drifts past as a slow
// conveyor; one card gets claimed in a tap. Breadth without screenshots.
export const TheStream: React.FC<Props> = ({ durationInFrames }) => {
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

  const claimPop = interpolate(
    frame,
    [STREAM_CLAIM_AT, STREAM_CLAIM_AT + 10, STREAM_CLAIM_AT + 16],
    [0, 1.12, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Constant conveyor drift — the beat's continuous motion.
  const xA = -frame * 2.1;
  const xB = -frame * 1.55;

  const row = (
    tasks: StreamTask[],
    x: number,
    startX: number,
    claimedIdx?: number,
  ) => (
    <div
      style={{
        position: "absolute",
        left: startX + x,
        display: "flex",
        gap: 44,
        width: CARD_SPAN * tasks.length * 2,
      }}
    >
      {[...tasks, ...tasks].map((t, i) => (
        <StreamCard
          key={`${t.title}-${i}`}
          task={t}
          claimed={i === claimedIdx}
          claimedPop={i === claimedIdx ? claimPop : 0}
        />
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <div
        style={{
          position: "absolute",
          top: 108,
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: INK_SOFT,
            opacity: interpolate(frame, [8, 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Real tasks from verified NGOs.
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 31,
            fontWeight: 500,
            color: "rgba(30,41,59,0.6)",
            opacity: interpolate(frame, [22, 40], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Five to thirty minutes each. Claim one in a tap.
        </div>
      </div>

      <div style={{ position: "absolute", top: 360, left: 0, right: 0, height: 250 }}>
        {row(ROW_A, xA, 60)}
      </div>
      <div style={{ position: "absolute", top: 680, left: 0, right: 0, height: 250 }}>
        {row(ROW_B, xB, -180, CLAIMED_INDEX)}
      </div>
    </AbsoluteFill>
  );
};
