import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { Background } from "./components/Background";
import { StatusDock } from "./components/StatusDock";
import { ColdOpen } from "./scenes/ColdOpen";
import { FootageBeat } from "./scenes/FootageBeat";
import { LoopClose } from "./scenes/LoopClose";
import { Endcard } from "./scenes/Endcard";

// Timeline (30 fps, 1545 frames / 51.5s). Beat 6 is the longest dwell — the
// badge money shot holds on the earned tile after the glow blooms.
const B1_COLD_OPEN = { from: 0, dur: 150 };
const B2_FEED = { from: 150, dur: 180 };
const B3_CLAIM = { from: 330, dur: 180 };
const B4_SUBMIT = { from: 510, dur: 210 };
const B5_APPROVE = { from: 720, dur: 210 };
const B6_BADGE = { from: 930, dur: 255 };
const B7_LOOP = { from: 1185, dur: 150 };
const B8_END = { from: 1335, dur: 210 };

// Absolute frames of the decisive clicks in the source footage
// (re-pinned 2026-07-17 after the cursor-glide re-record).
const CLICK_FRAMES = [
  105, // time chip lands on the cold-open card
  486, // Claim this task (loop.mp4 @ ~39.7s)
  669, // Submit for review (loop.mp4 @ ~71.3s)
  876, // Approve (loop.mp4 @ ~112.7s)
];
const CHIME_FRAME = 1035; // badge vault reveal (loop.mp4 @ ~146s)
const WHOOSH_FRAMES = [145, 330, 1185];

// Dock stamps ride ~12 frames behind their clicks (local to dock sequence).
const DOCK_FROM = B3_CLAIM.from;
const DOCK_STAMPS: [number, number, number, number] = [
  486 + 12 - DOCK_FROM,
  669 + 12 - DOCK_FROM,
  876 + 12 - DOCK_FROM,
  CHIME_FRAME + 12 - DOCK_FROM,
];
const DOCK_DUR = B6_BADGE.from + B6_BADGE.dur - DOCK_FROM;

export const MyComposition: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />

      <Sequence from={B1_COLD_OPEN.from} durationInFrames={B1_COLD_OPEN.dur}>
        <ColdOpen durationInFrames={B1_COLD_OPEN.dur} />
      </Sequence>

      <Sequence from={B2_FEED.from} durationInFrames={B2_FEED.dur}>
        <FootageBeat
          src="feed.mp4"
          trimStartSec={15}
          durationInFrames={B2_FEED.dur}
          enter
          caption="Filter by the minutes you have and the skills you know."
          captionFrom={28}
          captionUntil={160}
          captionBottom={74}
        />
      </Sequence>

      <Sequence from={B3_CLAIM.from} durationInFrames={B3_CLAIM.dur}>
        <FootageBeat
          src="loop.mp4"
          trimStartSec={34.5}
          durationInFrames={B3_CLAIM.dur}
          prevSrc="feed.mp4"
          prevTrimStartSec={21}
        />
      </Sequence>

      <Sequence from={B4_SUBMIT.from} durationInFrames={B4_SUBMIT.dur}>
        <FootageBeat
          src="loop.mp4"
          trimStartSec={66}
          durationInFrames={B4_SUBMIT.dur}
          prevSrc="loop.mp4"
          prevTrimStartSec={40.5}
          caption="Hand in the work right here."
          captionFrom={20}
          captionUntil={115}
        />
      </Sequence>

      <Sequence from={B5_APPROVE.from} durationInFrames={B5_APPROVE.dur}>
        <FootageBeat
          src="loop.mp4"
          trimStartSec={107.5}
          durationInFrames={B5_APPROVE.dur}
          prevSrc="loop.mp4"
          prevTrimStartSec={73}
          caption="The org reviews it on the spot — no inbox detour."
          captionFrom={25}
          captionUntil={150}
        />
      </Sequence>

      <Sequence from={B6_BADGE.from} durationInFrames={B6_BADGE.dur}>
        <FootageBeat
          src="loop.mp4"
          trimStartSec={142.5}
          durationInFrames={B6_BADGE.dur}
          exit
          pushScale={1.34}
          pushOrigin="36% 72%"
          pushFrom={80}
          pushSettleFrames={82}
          pushCreep={0.06}
          preDrift={0.03}
          glow
          glowX={36}
          glowY={72}
          glowFrom={CHIME_FRAME - B6_BADGE.from}
        />
      </Sequence>

      <Sequence from={DOCK_FROM} durationInFrames={DOCK_DUR}>
        <StatusDock stampFrames={DOCK_STAMPS} exitFrame={DOCK_DUR} />
      </Sequence>

      <Sequence from={B7_LOOP.from} durationInFrames={B7_LOOP.dur}>
        <LoopClose durationInFrames={B7_LOOP.dur} />
      </Sequence>

      <Sequence from={B8_END.from} durationInFrames={B8_END.dur}>
        <Endcard />
      </Sequence>

      {/* Music bed: fade in over 1s, fade out over the endcard. */}
      <Audio
        src={staticFile("audio.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, 1485, 1545], [0, 0.55, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {CLICK_FRAMES.map((f) => (
        <Sequence key={`click-${f}`} from={f} durationInFrames={30}>
          <Audio src={staticFile("sfx_click.wav")} volume={0.7} />
        </Sequence>
      ))}
      {WHOOSH_FRAMES.map((f) => (
        <Sequence key={`whoosh-${f}`} from={f} durationInFrames={45}>
          <Audio src={staticFile("sfx_whoosh.wav")} volume={0.55} />
        </Sequence>
      ))}
      <Sequence from={CHIME_FRAME} durationInFrames={60}>
        <Audio src={staticFile("sfx_chime.wav")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
