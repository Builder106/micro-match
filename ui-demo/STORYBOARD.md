# Tier 2 UI demo storyboard — "One task, told end-to-end"

Status: APPROVED 2026-07-17 (one change: music swapped to "Wholesome") and BUILT —
final render at `out/micromatch-ui-demo.mp4`. Beat 6 money shot strengthened
2026-07-17: the raw footage has no lock→earned flip (the tile is already earned,
the scroll just reveals it), so the payoff is manufactured in Remotion — a coral
glow bloom + ring ping locked to the badge tile, synced to the chime and the
`Badge minted` chip stamp; a settle-and-hold zoom (1.34, origin on the tile) with
a slow post-settle drift so the held frame never freezes. Beat 6 is now the
longest dwell (255 frames); total runtime 1545 frames / 51.5s.

## Concept

The demo follows a single real task — **"Translate a medical flyer into Spanish"
(Doctors Without Borders, 15 mins, #spanish #health)** — through the product's own
state machine: open in the feed → claimed → submitted → approved → badge minted.
The protagonist is the task card itself, and the structure is the status lifecycle
that `docs/positioning.md` names as the differentiator: the loop closes on-platform.

The spine is *real screen recording* — the Tier 1 closed-loop demo mp4
(`e2e/demo/output/chromium-04-closed-loop-claim-submit-approve-badge.mp4`, 110s,
2560×1600@25fps, recorded after the below-the-fold badge fix) — trimmed to the four
decisive moments. Remotion supplies the framing, the kinetic text, the status-chip
motif, and the endcard. The Blender laptop appears only as endcard furniture.

Why this can't be diffed against another video: there is no hook/mission/solution
arc, no mid-video 3D product showcase, no feature-card fan-out, no stat rings. The
structure is a state machine traversal, which is MicroMatch's own shape.

## Format

- 1920×1080 @ 30fps, ~51.5s → **1545 frames** (Root.tsx `durationInFrames`).
- Screen recordings (16:10) framed as rounded app-window cards on cream `#FDFCF8`,
  with slow scale/pan so they never letterbox.
- Persistent motif: a mini task-card docked bottom-left from Beat 3 onward; each loop
  stage stamps a status chip onto it (product chip styling: coral `#FF6B6B`→`#fb923c`
  pills, Plus Jakarta Sans).
- All UI text set in Plus Jakarta Sans (headings) / Inter (body), ink `#0f172a`.

## Beats

| # | Time | Beat | On screen | Source | Text / audio |
|---|------|------|-----------|--------|--------------|
| 1 | 0:00–0:05 | Cold open: card anatomy | Cream void. The task card assembles piece by piece in product styling — icon, title, org line, `#spanish` `#health` chips — and the **`15 mins`** time chip lands last, with a click. These are literally the fields the Post-a-task page says volunteers see first. | Remotion-built card (styles lifted from product CSS) | Line 1: "Volunteering usually asks for your weekend." → Line 2: "This asks for fifteen minutes." SFX: click on chip-land. Music fades in. |
| 2 | 0:05–0:11 | The feed | Card shrinks and flies into its real slot in the live feed. Real footage: search bar, **≤15 / ≤20 / ≤30 min** time filters and tag chips being clicked; the page's own headline "Find your next mission." carries the beat — no overlay text needed. | `chromium-03-feed-tour…mp4` (filter interaction, ~5s excerpt) + `mm_tasks.png` for the handoff frame | SFX: whoosh on the fly-in. |
| 3 | 0:11–0:17 | Claim | Real footage: task detail page — "The mission" brief, cursor clicks **Claim this task**. Mini-card docks bottom-left, stamps chip: `Claimed`. | closed-loop mp4, ~0:22–0:32 | SFX: click. |
| 4 | 0:17–0:24 | Submit | Real footage: "Send your work for review." — proof URL fills, **Submit for review** clicked. Chip stamps: `In review`. | closed-loop mp4, ~0:34–0:46 | Small caption: "Hand in the work right here." SFX: click. |
| 5 | 0:24–0:31 | Approve (org side) | Real footage: NGO console — "Awaiting your review" card with the volunteer's submission note, cursor clicks **Approve**. Chip stamps: `Approved`. (The console's "8 tasks live / 1 submission" is incidental fixture UI — never captioned, never zoomed.) | closed-loop mp4, ~1:10–1:22 | Caption: "The org reviews it on the spot — no inbox detour." SFX: click. |
| 6 | 0:31–0:38 | Badge (money shot) | Real footage: back on the volunteer dashboard — badge vault, the **First Mission** tile flips from locked to earned, "1 earned". Longest dwell in the video; soft coral glow accent around the tile (Remotion overlay, subtle). Chip stamps: `Badge minted`. | closed-loop mp4, ~1:36–1:50 | SFX: chime. Music lifts. |
| 7 | 0:38–0:43 | The loop closes | The four stamped chips detach from the mini-card, arrange into a cycle, and the arrows join — the product's own status language drawing its closed loop. | Remotion motion graphics | Text: "Claim to badge, all in one place." Subline: "Every badge is work an NGO signed off on." |
| 8 | 0:43–0:50 | Endcard | Blender laptop sway loop (existing 60-frame sequence, half speed) with the live landing page on screen; logo + wordmark; hero line; URL; FOSS chip. Music resolves and fades over the last 1.5s. | `mm_laptop_0001–0060.png`, `static/logo.png` | Text: "Make a big impact in a few minutes." → `trymicromatch.vercel.app` → "Free & open source · github.com/Builder106/MicroMatch". |

## Copy (all of it)

Hook: "Volunteering usually asks for your weekend." / "This asks for fifteen minutes."
Beat 4 caption: "Hand in the work right here."
Beat 5 caption: "The org reviews it on the spot — no inbox detour."
Beat 7: "Claim to badge, all in one place." / "Every badge is work an NGO signed off on."
Endcard: "Make a big impact in a few minutes." (site hero, verbatim) + URL + FOSS line.
Everything else on screen is the product's own copy, unedited. No usage numbers anywhere.

## Audio

- Bed: keep **"Carefree" (Kevin MacLeod, CC BY 4.0)** — the ukulele warmth matches the
  coral/cream register. Credit line from `public/CREDITS.md` required in any publish
  description. Swap candidate if it reads too jaunty against the 50s runtime: another
  incompetech track via curl, same credit pattern.
- SFX: existing `sfx_click.wav` (beats 1, 3, 4, 5), `sfx_whoosh.wav` (beat 2 fly-in,
  beat 7 chip convergence), `sfx_chime.wav` (beat 6 badge). Frame-aligned to the visual.
- Target ≈ −22 LUFS mean, ~1s fade-in, fade-out over endcard.

## Build notes

- No reseed needed: every beat reuses existing footage/renders. Reseed only if we
  decide to re-record any capture (`bun run seed` first, per JOURNAL 2026-07-16).
- Closed-loop mp4 in/out points above are ±3s; refine by frame-stepping at build time.
- Root.tsx: durationInFrames 1545. Beat 6 is 255 frames (money-shot dwell);
  B7 starts at 1185, B8 at 1335. Beat 6 glow/zoom knobs live on the `FootageBeat`
  props in `Composition.tsx` (`glow`, `pushScale`, `pushOrigin`, `pushSettleFrames`,
  `pushCreep`).
- Verify: extracted frames at 1 fps overall + 2–3 fps across every cut, silencedetect
  + LUFS check, before calling it done.

## Open options (pick at approval)

1. Voiceover: storyboard is designed text-only (music + SFX). Optional narration via
   the ElevenLabs pipeline exists if wanted — would need a ~110-word script.
2. Music: keep "Carefree" vs. swap.
3. Hook copy: "weekend" line vs. a quieter alternative ("Most volunteering wants your
   Saturday." etc.).
