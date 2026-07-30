import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { CORAL, FONT_BODY, FONT_HEAD, INK_SOFT } from "../theme";

const pop = (frame: number, at: number): React.CSSProperties => {
  const o = interpolate(frame, [at, at + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [at, at + 12], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return { opacity: o, translate: `0px ${y}px` };
};

const TAGS: { label: string; bg: string; color: string }[] = [
  { label: "#translation", bg: "#DBEAFE", color: "#2563EB" },
  { label: "#spanish", bg: "#F3E8FF", color: "#9333EA" },
  { label: "#health", bg: "#D1FAE5", color: "#059669" },
];

type TaskCardProps = {
  // Local frame at which assembly starts.
  from: number;
  // Local frame at which the time chip lands (SFX is aligned to this).
  chipAt: number;
};

// Replica of the real feed card for "Translate a medical flyer into
// Spanish", assembled piece by piece: the exact fields the Post-a-task
// page says volunteers see first (title, short description, time, tags).
export const TaskCard: React.FC<TaskCardProps> = ({ from, chipAt }) => {
  const frame = useCurrentFrame();

  const shellO = interpolate(frame, [from, from + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shellS = interpolate(frame, [from, from + 18], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const chipScale = interpolate(
    frame,
    [chipAt, chipAt + 8, chipAt + 14],
    [2.2, 0.94, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.34, 1.2, 0.64, 1),
    },
  );
  const chipO = interpolate(frame, [chipAt, chipAt + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 648,
        borderRadius: 28,
        backgroundColor: "#fff",
        boxShadow: "0 30px 70px rgba(15,23,42,0.13)",
        border: "1px solid rgba(15,23,42,0.06)",
        padding: "40px 44px",
        opacity: shellO,
        scale: String(shellS),
        fontFamily: FONT_BODY,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: "#FFD9CF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...pop(frame, from + 12),
          }}
        >
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s-7.5-4.9-9.8-9.2C.9 9.2 2.2 6 5.2 5.2c1.9-.5 3.9.2 5 1.8L12 9l1.8-2c1.1-1.6 3.1-2.3 5-1.8 3 .8 4.3 4 3 6.6C19.5 16.1 12 21 12 21z"
              fill={CORAL}
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 999,
            backgroundColor: "#FFE7E2",
            color: CORAL,
            fontWeight: 700,
            fontSize: 24,
            opacity: chipO,
            scale: String(chipScale),
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={CORAL} strokeWidth="2.4" />
            <path
              d="M12 7v5l3.2 1.9"
              stroke={CORAL}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          15 min
        </div>
      </div>

      <div
        style={{
          marginTop: 30,
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "0.14em",
          color: "rgba(30,41,59,0.5)",
          ...pop(frame, from + 24),
        }}
      >
        ENGLISH
      </div>

      <div
        style={{
          marginTop: 12,
          fontFamily: FONT_HEAD,
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1.2,
          color: INK_SOFT,
          ...pop(frame, from + 24),
        }}
      >
        Translate a medical flyer into Spanish
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 24,
          lineHeight: 1.55,
          color: "rgba(30,41,59,0.75)",
          ...pop(frame, from + 38),
        }}
      >
        Help patients understand a one-page flyer about diabetes screenings.
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {TAGS.map((t, i) => (
            <div
              key={t.label}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                backgroundColor: t.bg,
                color: t.color,
                fontSize: 20,
                fontWeight: 600,
                whiteSpace: "nowrap",
                ...pop(frame, from + 50 + i * 7),
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            backgroundColor: INK_SOFT,
            color: "#fff",
            fontSize: 21,
            fontWeight: 600,
            whiteSpace: "nowrap",
            flexShrink: 0,
            ...pop(frame, from + 64),
          }}
        >
          View task →
        </div>
      </div>
    </div>
  );
};
