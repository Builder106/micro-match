# MicroMatch design: the community quilt

This file is the source of truth for the new frontend. Read it before changing a page.

## Brief

- **Subject:** MicroMatch, a free, non-commercial student project launching first at Wesleyan.
  Nonprofits post tasks that take 5 to 30 minutes. Volunteers claim a task and submit proof (a
  link plus notes). A person at the nonprofit approves or rejects each claim. Approval awards
  the badges that nonprofit designed.
- **Audience:** students and busy people with a spare quarter hour; small nonprofit teams
  with a backlog and no time to recruit.
- **Job:** get a visitor to open the task feed, or get a nonprofit to post its first task.
- **Language:** English only this round, at `/en` routes.
- **Out of scope this round:** the WCAG audit, reduced-motion handling and localization.
  Semantic markup stays correct because the next round audits it.

## Concept card

```
Idea:        The whole site is one community quilt. Every page is a block sewn into it,
             and the middle of the quilt grows a patch for every task a person approved.
Metaphor:    A sampler friendship quilt: every block uses a different traditional pattern
             and keeps a plain center square where its maker signed it. At its heart is a
             log cabin block that grows from real approvals.
Signature:   Opening a block lifts it off the quilt and unfolds it into a panel of cloth;
             its place on the quilt becomes a chalked hole until you fold it back. The
             community block stitches itself together from live data.
Emotion:     A quilting bee in a church hall: unhurried, generous, many hands, one warm thing.
Motion verb: Pinned, then stitched. Pieces settle like fabric laid on a table, then a
             running stitch sews them in. Blocks lift and unfold; they never slide in as cards.
Screenshot:  The quilt filling the screen: the signed title block beside the live log cabin,
             sampler blocks around them, one block lifted out and open.
Structure:   The site is the quilt (one 2D canvas). You move by panning it (drag, scroll,
             arrow keys, the minimap) on desktop, and by reading it top to bottom on a phone.
             One unit is a block; opening it unfolds a panel at its own URL.
Escape hatch: /contents, the quilt's contents page: every block as a plain link.
```

### Structure plan

```
DESKTOP: the viewport is a window onto one quilt (5 x 4 cells, sashing, cornerstones, binding)

  [tag: logo, MicroMatch, where you are]                    [Contents] [Sign in | Your block]
  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  │ Your block   │ Tasks (flying geese, 2 wide)│ How it works │ For volunteers│
  ├──────────────┼──────────────┴──────────────┼──────────────┴──────────────┤
  │ For          │ TITLE BLOCK (2 x 2)         │ COMMUNITY BLOCK (2 x 2)     │
  │ nonprofits   │ "Small tasks, sewn into     │ live log cabin of approved  │
  ├──────────────┤  something warm." + CTAs    │ claims, chalked next strip  │
  │ About        │                             │                             │
  ├──────────────┼──────────────┬──────────────┼──────────────┬──────────────┤
  │ Contact      │ Help         │ Docs         │ API          │ Quilt label  │
  └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                                                     [minimap]

  Opening a block: it lifts, flies to the right and unfolds into a panel of cloth.
  The quilt pans so the chalked hole it left stays visible on the left.
  ┌───────────── quilt ─────────────┬────────────── panel ───────────────┐
  │  ... blocks ...  [ chalked hole ]│ [swatch] How it works   [Fold back]│
  │                                  │  page content (scrolls inside)     │
  └──────────────────────────────────┴────────────────────────────────────┘
  Panel sizes: read (public pages), work (feed, dashboard, editors), narrow (auth).

PHONE: the same blocks as a vertical path, two columns, native scroll
  [tag]                                 [Contents]
  TITLE (full width) / COMMUNITY (full width) / TASKS (full width)
  How it works | For volunteers / For nonprofits | Your block / About | Help /
  Docs | API / Contact | Quilt label
  Opening a block: a full-screen sheet unfolds from the block; "Fold back" returns.
```

- **Blocks and their patterns:** Tasks: flying geese. How it works: nine patch. For
  volunteers: friendship star. For nonprofits: churn dash. Your block: courthouse steps.
  About: rail fence. Contact: Ohio star. Help: pinwheel. Docs: hourglass. API: half-square
  triangles. Community: log cabin (live). Title: a pieced border around a large signed center.
  Quilt label: plain muslin with stitched writing, as on the back corner of a real quilt.
- **Routes to blocks:** `/tasks` and `/task/*` open Tasks. `/dashboard`, `/profile`, `/org`,
  `/badges/*`, `/admin/*` and the auth pages open Your block. `/impact` opens the community
  block. `/privacy`, `/terms` and `/cookies` open the quilt label. `/contents` opens a panel
  with no hole. The 404 opens over a cut-out hole with a loose thread.
- **No navbar, no footer.** Orientation comes from the top-left tag (in the quilt's terms:
  "You're at the How it works block"), the minimap and the hole. Legal and contact links live
  on the quilt label block and on `/contents`.
- **Web contracts kept:** every block has its own URL with server-rendered HTML; the camera's
  first position is computed in CSS from the route, so a deep link paints in place; the back
  button folds the panel; blocks are real links in reading order; keyboard focus pans the
  camera to the focused block; the page itself never scroll-jacks (the desktop quilt is a
  fixed canvas, panels and phone pages scroll natively).

### Anchors in real product facts

- Each nonprofit designs its badges (`badgeDefinitions`: label, color, icon, rule). A patch's
  fabric color and embroidered icon come from the badge definition that applies to the task:
  a task-specific badge first, then the nonprofit's any-task badge. A nonprofit with no badge
  yet produces a plain, undyed muslin patch. That is honest, and it nudges them to design one.
- A patch is sewn in only when a person at the nonprofit approves the claim
  (`claims.status === 'approved'`). Pending claims are "pinned": dashed outline, not sewn.
- The quilt is built from real approved claims through `src/lib/server/quilt.ts`. Nothing is
  invented to fill it. No names, faces or counts appear that the data does not hold.
- The log cabin pattern is a real quilt block. Tradition says its center square is red for
  the hearth. On the site the first patch takes whatever color its nonprofit chose, and the
  copy says so instead of pretending.

### Where the concept reaches

| Surface | Expression |
|---|---|
| Home | the whole quilt; the title and community blocks at its center |
| Every public page | a block unfolded into a reading panel, its hole chalked on the quilt |
| Impact (community block) | the whole live quilt large, with honest counts written as sentences |
| Volunteer dashboard | "Your block": a log cabin block of only your approved claims; pending claims are pinned beside it |
| Nonprofit dashboard | claims waiting to be sewn in; approving one plays the stitch on that patch |
| Badge editor | "Design a patch": fabric, embroidered icon, rule, with a live patch preview |
| Claim page | the patch this task will become, if the nonprofit has designed one |
| 404 | a hole cut in the quilt with a loose thread |

## Art direction

### Palette (natural dyes on muslin)

Quilts were dyed with three classic plant dyes: indigo (blue), madder (red) and weld
(yellow). The palette keeps the brand's cream ground and coral, and reads the coral as
madder.

| Role | Name | Hex | Use |
|---|---|---|---|
| ground | muslin | `#FDFCF8` | page ground (the existing brand cream, kept) |
| ink | indigo thread | `#1C1F3B` | text, binding, curtain, footer field |
| muted | faded indigo | `#575B76` | secondary text |
| line | basting | `rgb(28 31 59 / 0.16)` | hairlines, pinned outlines |
| accent | madder | `#FF6B6B` | primary actions (text on it is `#000`) |
| highlight | weld | `#F2B84B` | the chalked next strip, selection, focus ring |

Patch fabrics come from badge data. The badge editor offers a swatch book (madder, weld,
indigo, sage, rose, sky, plum, moss, marigold, slate) and accepts any hex. Thread color on a
patch is chosen by luminance (`threadFor()`), so icons stay legible on any fabric.

**Why keep cream and coral:** both are the product's existing identity. The quilt needs a
light cloth to sit on, and the coral reads naturally as madder. Pairing them with indigo ink
and a weld highlight, instead of a terracotta accent and a serif, keeps the ground warm
without the generic cream-and-clay editorial look.

**Single theme.** The site ships one committed light theme. The footer is an indigo field
with cream text, a deliberate chapter change, not a dark mode.

### Type

- **Display and UI:** Bricolage Grotesque (variable: weight, width, optical size; Google,
  OFL). At large optical sizes its ink traps and uneven counters read as hand cut. Headings
  use weight 700 to 800, width 90 to 100, optical size 96, tracking -0.03em to -0.045em,
  leading 0.92.
- **Text:** Host Grotesk (variable; Google, OFL). Calm and slightly humanist for long
  reading and forms.
- Self-hosted woff2, Latin subset only, two files. Never loaded from Google at runtime.
- Numbers in tabular figures when they count something.

Scale (`src/styles/tokens.css`): mega `clamp(3.1rem, 1rem + 8.4vw, 9.5rem)`, xl
`clamp(2.4rem, 1.3rem + 4.6vw, 5.5rem)`, l `clamp(1.6rem, 1.2rem + 1.8vw, 2.75rem)`,
m `clamp(1.2rem, 1.08rem + 0.55vw, 1.5rem)`, body `clamp(1rem, 0.96rem + 0.2vw, 1.125rem)`.

### Grid and rhythm

- 12 columns on desktop, gutter `clamp(1rem, 0.6rem + 1.6vw, 2.5rem)`, outer margin equals
  the gutter. Content hangs from three lines: column 1, column 6 and column 8.
- 4 columns on phones. The quilt goes full bleed minus the gutter.
- Section rhythm varies: tight (8u), normal (16u), airy (28u) and full viewport. No two
  adjacent sections share a mood.

### Shape

One radius: `3px`, the soft corner of cut cloth. Buttons, chips, swatches and patches all use
it. Patches add a hand-cut wobble (a slight rotation and uneven seams) instead of a larger
radius.

### Motion language

- Ease family: the engine's `expo.out` for settles, `power2.inOut` for stitches and the
  curtain. Hover feedback 0.3 to 0.45 s.
- **Settle:** `y: 14px → 0`, `rotate: -1.6deg → 0`, 0.9 s, `expo.out`. Large pieces move
  slower than small ones.
- **Stitch:** running stitches (dashed strokes) draw on through a mask, 0.5 to 1.2 s.
- **Primary buttons are patches:** madder cloth with a running stitch inset. On hover the
  patch lifts 2px, turns -0.6deg and the stitch runs (the dash offset travels like a needle
  working). Press settles it flat.
- **Nav links:** a running stitch draws under the link on hover; the current page keeps it.
- **Inline links:** a stitched (dashed) underline at rest that closes into a solid seam on
  hover.
- **Opening a block (the signature):** the block lifts off the quilt and flies to the panel's
  place, unfolding as it goes (0.8 s, `expo.out`); its pattern shows on the panel's face during
  the flight, then the page settles in. Its place on the quilt becomes a chalked hole.
  Folding back reverses it into the hole. Panel to panel, the content lifts away and the new
  one settles in while the camera pans to the new block's hole.
- **First visit:** the blocks are laid down one by one (transform-only CSS keyframes).
- **Idle:** the chalked next strip's running stitch keeps marching slowly, and the whole
  quilt hangs a few pixels toward the pointer like cloth on a frame. It runs on the GSAP
  ticker and pauses off screen. Visual tests hold it still with a `mm-still` flag.
- **Panels:** public reading panels scroll with Lenis inside the panel; app panels (feed,
  task, claim, dashboard, editors, auth) scroll natively and keep motion to what reports a
  change: the patch preview, approving a claim (a stitch runs across the review).
- No loader. MicroMatch is a product, so the hero shows up at once. The hero text intro is a
  transform-only CSS keyframe gated on `html.motion`, which an inline script sets before
  paint. Without JavaScript all text is visible.

### Hover treatments (one per role)

| Role | Treatment |
|---|---|
| Primary CTA | patch lift plus a running stitch |
| Secondary CTA | outlined patch whose stitch closes into a solid binding |
| Corner tags and account tabs | running-stitch underline draws on; the current tab is filled |
| Blocks on the quilt | the block lifts and turns slightly; opening it unfolds the panel |
| Task swatches and cards | the swatch lifts and turns slightly; its pinked edge stays put |
| Quilt patches | lift and show a fabric label with the badge and the task length |
| Utility links (legal, footer small print) | color only |

## Composition plans (views inside the structure)

- **The quilt at rest (home):** the camera centers the title and community blocks; sampler
  blocks frame them on every side so the quilt reads as larger than the window. Each sampler
  block is its pattern in two or three fabrics with a signed muslin center: title in display
  type, one line of real copy, a small stitched icon.
- **Reading panel:** cloth panel, right side, `min(58vw, 54rem)` wide. A selvedge strip on
  top carries the block's swatch and name and the "Fold back" button. Content is a reading
  column; long pages use one illustration that changes state (how it works) or an index list
  (help, docs).
- **Work panel:** wider (`calc(100vw - 8rem)`, capped). Feed: filter rail plus a wall of pinked
  task swatches. Dashboards: the volunteer's own block beside claims; the nonprofit's review
  list beside its block. Editors: form beside a live patch preview.
- **Narrow panel:** auth forms beside a single patch.
- **Phone:** blocks become a two-column path; panels are full-screen sheets.

## Genericness test

| A generic model would... | Changed to |
|---|---|
| a navbar over a hero, stacked sections and a footer | the site is one quilt; pages are blocks that unfold; corner tags and a minimap orient |
| show a patchwork grid of equal squares, like a calendar | a sampler of traditional block patterns around a wonky log cabin that grows from the center |
| use cream, terracotta and a serif | brand cream with indigo ink, madder and weld (the three natural dyes); a grotesk |
| show stats in KPI tiles | counts written into sentences, sewn on fabric labels |
| use color-swap hovers | blocks lift; running stitches draw and travel |
| fill the empty quilt with sample patches | an empty frame with one square chalked in |
| put legal links in a footer | a quilt label block, as quilters sew one on with the maker details |

## Drawn assets

Drawn with the Glaxnimate MCP server and kept in `design/glaxnimate/` (see its README).
Components inline the path data from `src/lib/quilt/art.ts`, and patches are composed at
runtime from that data plus each badge's real color and icon.

## Technical notes

- The quilt (`src/lib/components/world/`) lives in the root layout and persists across
  navigation. Routes render inside the panel. On desktop the quilt is a fixed canvas moved by
  one camera on the GSAP ticker; on phones it is a native-scroll two-column grid. Same DOM,
  CSS switches the form at 900px.
- The camera's first position is pure CSS (`--bx`, `--by` in pitch units from the route), so
  server-rendered pages paint in place; JavaScript takes over from that position.
- Engine (`src/engine/`): camera (pan, drag, wheel, keys, focus), panel (unfold, fold, swap,
  Lenis inside public reading panels), idle input, Glaxnimate helpers. App panels scroll
  natively.
- Navigation: `beforeNavigate` starts the fold or content swap, `onNavigate` awaits it,
  `afterNavigate` unfolds the new panel and pans the camera.
- `box-sizing: border-box` lives in the global stylesheet. JavaScript-added classes and
  slotted-child styles use `:global()`.
- Copy: UI strings live in `messages/en.json`. Long-form prose (legal text, docs, help
  answers) stays in its page component, in English.
- Idle motion: on (the community block's chalked strip and a slight sway of the quilt).
