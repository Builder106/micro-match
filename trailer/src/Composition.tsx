import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "./components/Background";
import { QuarterHour, LINE_FRAMES } from "./scenes/QuarterHour";
import { TheTurn } from "./scenes/TheTurn";
import {
  TheMatch,
  MATCH_CONTACT_AT,
  MATCH_WORDMARK_AT,
} from "./scenes/TheMatch";
import { TheStream, STREAM_CLAIM_AT } from "./scenes/TheStream";
import { TheRecord, COIN_FRAMES } from "./scenes/TheRecord";
import { Invitation, URL_PILL_AT } from "./scenes/Invitation";

// Timeline (30 fps, 1590 frames / 53s). Nominal cuts at 210 / 420 / 750 /
// 1050 / 1290; each incoming scene starts 15–20 frames inside the outgoing
// fade so no cut shows bare cream (JOURNAL 2026-07-17 lesson).
export const TRAILER_DURATION = 1590;

const B1 = { from: 0, dur: 225 };
const B2 = { from: 205, dur: 232 };
const B3 = { from: 417, dur: 350 };
const B4 = { from: 747, dur: 320 };
const B5 = { from: 1047, dur: 260 };
const B6 = { from: 1287, dur: TRAILER_DURATION - 1287 };

// Absolute SFX frames, derived from the scenes' exported local cue frames.
const TICK_FRAMES = LINE_FRAMES.map((f) => B1.from + f);
const CLICK_FRAMES = [
  B3.from + MATCH_CONTACT_AT,
  B4.from + STREAM_CLAIM_AT,
  B5.from + COIN_FRAMES[0],
  B5.from + COIN_FRAMES[1],
  B6.from + URL_PILL_AT,
];
const WHOOSH_FRAMES = [B3.from + 15, B4.from + 8, B6.from + 8];
const CHIME_FRAMES = [B3.from + MATCH_WORDMARK_AT, B5.from + COIN_FRAMES[2]];

export const Trailer: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />

      <Sequence from={B1.from} durationInFrames={B1.dur}>
        <QuarterHour durationInFrames={B1.dur} />
      </Sequence>
      <Sequence from={B2.from} durationInFrames={B2.dur}>
        <TheTurn durationInFrames={B2.dur} />
      </Sequence>
      <Sequence from={B3.from} durationInFrames={B3.dur}>
        <TheMatch durationInFrames={B3.dur} />
      </Sequence>
      <Sequence from={B4.from} durationInFrames={B4.dur}>
        <TheStream durationInFrames={B4.dur} />
      </Sequence>
      <Sequence from={B5.from} durationInFrames={B5.dur}>
        <TheRecord durationInFrames={B5.dur} />
      </Sequence>
      <Sequence from={B6.from} durationInFrames={B6.dur}>
        <Invitation durationInFrames={B6.dur} />
      </Sequence>

      {/* Music bed: 1s fade-in, fade-out over the endcard's last 2s. */}
      <Audio
        src={staticFile("audio.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 1520, 1585], [0, 0.55, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {TICK_FRAMES.map((f) => (
        <Sequence key={`tick-${f}`} from={f} durationInFrames={30}>
          <Audio src={staticFile("sfx_click.wav")} volume={0.3} />
        </Sequence>
      ))}
      {CLICK_FRAMES.map((f) => (
        <Sequence key={`click-${f}`} from={f} durationInFrames={30}>
          <Audio src={staticFile("sfx_click.wav")} volume={0.7} />
        </Sequence>
      ))}
      {WHOOSH_FRAMES.map((f) => (
        <Sequence key={`whoosh-${f}`} from={f} durationInFrames={45}>
          <Audio src={staticFile("sfx_whoosh.wav")} volume={0.5} />
        </Sequence>
      ))}
      {CHIME_FRAMES.map((f) => (
        <Sequence key={`chime-${f}`} from={f} durationInFrames={60}>
          <Audio src={staticFile("sfx_chime.wav")} volume={0.75} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
