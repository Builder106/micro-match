# MicroMatch Tier 3 trailer

The concept-first marketing trailer: 53s, 1920×1080@30fps, composition id
`MicroMatchTrailer`. It sells the quarter-hour idea and shows almost none of the
site — that restraint is the point. The screen-by-screen walkthrough lives in
`../ui-demo/`; this piece exists for judges, press, and the WesFest table.
Beat structure and the reasoning behind it are in `STORYBOARD.md`.

## Build

```console
npm i
cp ../ui-demo/public/mm_laptop_00*.png public/
```

The laptop sway sequence is gitignored here (60 frames, ~120 MB, deterministic).
Copy it from `ui-demo/public/` as above, or re-render it from scratch with
`../tools/device-render/laptop.py` in Blender (about an hour; test a single
still first — see that directory's README).

## Preview and render

```console
npm run dev
npm run render
```

The render lands at `out/micromatch-trailer.mp4` (gitignored, like ui-demo's).
`npm run render` deletes the copied `public/mm_laptop_*.png` frames once the
render finishes — re-copy them from `ui-demo/public/` before rendering again.

Check `df -h /` before rendering — this machine runs low on disk, and a render
that dies instantly with `npm error could not determine executable to run`
means `node_modules` got wiped by a cleanup, not that the code broke.

## Verify

Exit codes are not the test; frames are. After every render:

- Extract frames with the claude-video-vision MCP at 2–3 fps across the cuts
  (nominal cuts: frames 210 / 420 / 750 / 1050 / 1290).
- `ffmpeg -i out/micromatch-trailer.mp4 -vf freezedetect -af silencedetect -f null -`
  at the default log level — `-v error` silences both filters and reports a
  false all-clear.
- Loudness sits around -22 LUFS mean (`-af ebur128 -f null -`, also info-level).

## Music

`public/audio.mp3` is Kevin MacLeod's "Inspired" (CC BY 4.0) — the credit line in
`public/CREDITS.md` must ship with any publish. The audition alternate
("Heartwarming") and the raw downloads live in `scratch/`. To audition a swap
without re-rendering, mux it under the existing video:

```console
ffmpeg -i out/micromatch-trailer.mp4 -i scratch/Heartwarming.mp3 -map 0:v -map 1:a -c:v copy -shortest scratch/draft-heartwarming.mp4
```

Rejected idioms, for the record: "Life of Riley", "Carefree", and the whole
jaunty-ukulele-and-whistling register.
