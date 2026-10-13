// Motion parameters and pure timeline math for the homepage Handoff Table.
// Every scene range, stop, and asset mapping lives here so tuning passes
// change only this module (see DESIGN.md, "Homepage Redesign").

export const SCENES = {
  post: [0, 0.15],
  claim: [0.15, 0.3],
  work: [0.3, 0.55],
  proof: [0.55, 0.7],
  review: [0.7, 0.85],
  badge: [0.85, 1]
} as const satisfies Record<string, readonly [number, number]>;

export type Scene = keyof typeof SCENES;
export const STEP_ORDER: readonly Scene[] = ['post', 'claim', 'work', 'proof', 'review', 'badge'];

/** Below this width the table turns: NGO on top, volunteer below. */
export const MOBILE_BREAKPOINT = 768;
/** Ticket centers as viewport fractions: NGO side, then volunteer side. */
export const DESKTOP_STOPS = [0.25, 0.75] as const;
export const MOBILE_STOPS = [0.26, 0.54] as const;
/** How long the time lanes stay after the work starts, in stage progress. */
export const LANES_LINGER = 0.03;
/** Stage progress at which the live task list and role links take over. */
export const END_AT = 0.92;
/** The minute dial's timeline spans 30 minutes. */
export const DIAL_MINUTES = 30;
export const DEFAULT_MINUTES = 15;
/** Every Glaxnimate asset timeline is one second long. */
export const ASSET_SECONDS = 1;

export type Family = 'translate' | 'data' | 'proofread' | 'photos';
const FAMILY_KEYWORDS: ReadonlyArray<[Family, readonly string[]]> = [
  ['translate', ['translat', 'spanish', 'french', 'language', 'arabic', 'portuguese', 'german', 'chinese']],
  ['data', ['data', 'excel', 'spreadsheet', 'verify', 'research', 'survey']],
  ['proofread', ['proofread', 'edit', 'writing', 'education', 'review', 'copy']],
  ['photos', ['photo', 'image', 'history', 'archive', 'design', 'tag']]
];

export const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** Progress through one scene range, 0 before it and 1 after it. */
export function local(progress: number, [start, end]: readonly [number, number]): number {
  return clamp((progress - start) / (end - start));
}

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Where the ticket is along the table: 0 is the NGO side, 1 the volunteer side. */
export function along(progress: number): number {
  if (progress < SCENES.claim[0]) return 0;
  if (progress < SCENES.work[0]) return easeOutCubic(local(progress, SCENES.claim));
  if (progress < SCENES.proof[0]) return 1;
  if (progress < SCENES.review[0]) return 1 - easeOutCubic(local(progress, SCENES.proof));
  return 0;
}

/** The scene whose caption is shown at this progress. */
export function activeScene(progress: number): Scene {
  return STEP_ORDER.find((scene) => progress < SCENES[scene][1]) ?? 'badge';
}

export function taskMinutes(minutes: number | undefined): number {
  return typeof minutes === 'number' && minutes > 0 ? Math.min(minutes, DIAL_MINUTES) : DEFAULT_MINUTES;
}

/** The ticket clock, counting up to the task's minutes during the work scene. */
export function clockText(progress: number, minutes: number): string {
  // The epsilon keeps floating-point scene math from showing 7:29 for 7:30.
  const totalSeconds = Math.floor(local(progress, SCENES.work) * minutes * 60 + 1e-6);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

/** The dial still to show without motion: the task's minutes rounded up to a 5-minute step. */
export function dialStill(minutes: number): string {
  const step = Math.min(DIAL_MINUTES, Math.max(5, Math.ceil(minutes / 5) * 5));
  return `minute-dial-${String(step).padStart(2, '0')}`;
}

export function vignetteFor(tags: readonly string[]): Family {
  const words = tags.map((tag) => tag.replace(/^#/, '').toLowerCase());
  for (const [family, keywords] of FAMILY_KEYWORDS) {
    if (words.some((word) => keywords.some((keyword) => word.includes(keyword)))) return family;
  }
  return 'translate';
}

export type AssetTimelines = Record<
  'ink-stamp-posted' | 'ink-stamp-approved' | 'verified-seal' | 'time-lanes' | 'minute-dial' | 'vignette' | 'proof-clip' | 'badge-press',
  number
>;

/** Each asset's own 0-1 timeline position for a stage progress. */
export function assetTimelines(progress: number, minutes: number): AssetTimelines {
  return {
    'ink-stamp-posted': local(progress, SCENES.post),
    'ink-stamp-approved': local(progress, SCENES.review),
    'verified-seal': local(progress, SCENES.post),
    'time-lanes': local(progress, SCENES.claim),
    'minute-dial': (local(progress, SCENES.work) * minutes) / DIAL_MINUTES,
    vignette: local(progress, SCENES.work),
    'proof-clip': local(progress, SCENES.proof),
    'badge-press': local(progress, SCENES.badge)
  };
}

export type StageState = {
  scene: Scene;
  reviewing: boolean;
  lanesVisible: boolean;
  ended: boolean;
};

export function stageState(progress: number): StageState {
  return {
    scene: activeScene(progress),
    reviewing: progress >= SCENES.review[0],
    lanesVisible: progress < SCENES.work[0] + LANES_LINGER,
    ended: progress >= END_AT
  };
}

export type Viewport = { width: number; height: number; rtl: boolean };

/** The ticket's center inside the stage, in pixels. */
export function ticketPosition(progress: number, { width, height, rtl }: Viewport): { x: number; y: number } {
  const t = along(progress);
  if (width < MOBILE_BREAKPOINT) {
    return { x: width / 2, y: lerp(height * MOBILE_STOPS[0], height * MOBILE_STOPS[1], t) };
  }
  const [ngo, volunteer] = rtl ? [DESKTOP_STOPS[1], DESKTOP_STOPS[0]] : DESKTOP_STOPS;
  return { x: lerp(width * ngo, width * volunteer, t), y: height / 2 };
}

/** SMIL time for an asset timeline, kept just inside the end so the last frame holds. */
export function seekSeconds(timeline: number): number {
  return Math.min(clamp(timeline), 0.9999) * ASSET_SECONDS;
}
