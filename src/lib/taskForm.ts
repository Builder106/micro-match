// The task form's rules. MicroMatch tasks take 5 to 30 minutes.
export const TASK_MINUTES = [5, 10, 15, 20, 25, 30] as const;
export const LIMITS = { title: 140, short: 280, brief: 4000 } as const;

/** "translation, #Health, , design" -> ["translation", "health", "design"] */
export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const tag = part.trim().replace(/^#/, '').toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}
