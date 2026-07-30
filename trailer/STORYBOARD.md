# Tier 3 trailer storyboard — "A quarter of an hour"

Status: BUILT 2026-07-18 — render at `out/micromatch-trailer.mp4`, 1590 frames /
53s at 1920×1080@30fps. Music: Kevin MacLeod's "Inspired" (see `public/CREDITS.md`);
"Heartwarming" sits in `scratch/` as the audition alternate.

## Concept

The trailer is built from the product's name. Fifteen minutes is a quarter of a
clock face, so a thin coral arc that only ever draws 90° becomes the through-line:
it ticks in the cold open, seals the match, rims the badges, and returns for the
closing question. "Micro" is the quarter hour; "Match" is the moment an NGO's need
and a volunteer's spare minutes click together on screen. The video sells that idea
and shows almost none of the site — the only product pixels are the landing page
inside the Blender laptop on the endcard.

## Why this is not STAIJA's structure

STAIJA's arc is hook → mission → solution → climax → outro, with a mid-video 3D
device showcase and a feature-card fan-out. This piece has no mission beat and no
solution reveal. Its skeleton is a reframe (idle minutes → usable minutes), a
convergence (the match), a conveyor of real inventory, and a question. The rings
here are clock arcs that carry no number, not stat rings; the cards drift past as
a lateral stream, not a fan-out; the 3D device appears only as endcard furniture.
The v1 palette-swap rejection (JOURNAL 2026-07-16) is the reason this section
exists.

## Beats

| # | Frames | Beat | On screen | Audio |
|---|--------|------|-----------|-------|
| 1 | 0–210 | The quarter hour | Clock face left, type right. "Fifteen minutes is…" then three reframes in sequence: "a coffee going cold." / "one bus stop." / "half a scroll." The arc ticks 30° with each line and stops at 90°. | Soft tick (low click) per line. Music fades in over 1s. |
| 2 | 210–420 | The turn | "It's also enough to help someone." centered, "help someone" in the coral gradient. The completed quarter arc pulses above; a warm glow blooms behind. | Music carries the beat. |
| 3 | 420–750 | The match | Two cards slide in and click together: left, the real seed task (Doctors Without Borders, "Translate a medical flyer into Spanish", 15 mins, ✓ Verified NGO); right, "You" with "Fifteen minutes before your next class" and skill chips. On contact a ring bursts and the wordmark assembles — "Micro" from the left card's side, "Match" from the right's. Caption: "A need, met in minutes you already have." | Whoosh on the slide, click on contact, chime on the wordmark. |
| 4 | 750–1050 | The stream | The eight evergreen tasks from `scripts/seed.ts` drift past as two slow conveyor rows, real titles and real durations, each with a ✓ Verified NGO chip. One card gets a "Claimed ✓" stamp mid-drift. Header: "Real tasks from verified NGOs." / "Five to thirty minutes each. Claim one in a tap." | Whoosh on entry, click on the stamp. |
| 5 | 1050–1290 | The record | Three badge coins mint in sequence (First Mission, Translator, Archivist), each rimmed with the quarter arc. "Your minutes leave a record." then "Every badge is work an NGO signed off on." No counts, no levels, no usage numbers. | Click, click, chime. |
| 6 | 1290–1590 | The invitation | "Got fifteen minutes?" full screen with the arc drawing one last time, then the endcard: logo + wordmark, the site hero verbatim, URL pill, "Free & open source — use it, or build it with us." and the GitHub path, Blender laptop sway on the right. | Whoosh on the question, click on the URL pill, music resolves and fades over the last 2s. |

Nominal cuts sit at 210 / 420 / 750 / 1050 / 1290; every incoming scene starts
15–20 frames inside the outgoing fade so no cut shows bare cream.

## Copy (all of it)

"Fifteen minutes is… a coffee going cold. / one bus stop. / half a scroll."
"It's also enough to help someone."
"A need, met in minutes you already have."
"Real tasks from verified NGOs." / "Five to thirty minutes each. Claim one in a tap."
"Your minutes leave a record." / "Every badge is work an NGO signed off on."
"Got fifteen minutes?"
Endcard: "Make a big impact in a few minutes." (site hero, verbatim) + URL + FOSS line.

Register check: free and open source, "come use this / build this". No investor
language, no growth claims, and no usage numbers anywhere — the only stats-shaped
things on screen are clock arcs.

## Motion rules

- The cream `Background` renders at full opacity for the whole video; scenes fade
  inner wrappers only, never their `AbsoluteFill` (gray-flash rule).
- Every hold carries low-amplitude motion: scale drift on beats 1/2/5/6, the
  post-contact drift on beat 3, the conveyor itself on beat 4. `freezedetect`
  should come back empty without excusing anything as "deliberate".
- SFX frames derive from cue constants the scenes export (`LINE_FRAMES`,
  `MATCH_CONTACT_AT`, `STREAM_CLAIM_AT`, `COIN_FRAMES`, `URL_PILL_AT`), so
  retiming a scene retimes its sounds.

## Open options

1. Voiceover: built text-only on purpose — music + SFX carry it. The ElevenLabs
   pipeline in HackHelper/content-pipeline can add narration later (~110 words,
   normalize from its quiet -26 LUFS output to about -16).
2. Music: "Inspired" shipped; audition `scratch/draft-heartwarming.mp4` before
   publishing anywhere.
3. A 9:16 cut would want a phone device shot (`phone.py` against the laptop rig's
   conventions) — tracked separately, out of scope here.
