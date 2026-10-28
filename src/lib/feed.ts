// The task feed's search, time filter, tags and sort. Pure, so the page stays thin.

export type FeedTask = {
  id: string;
  title: string;
  shortDescription: string;
  tags: string[];
  sourceTags?: string[];
  estimatedMinutes?: number;
};

export const TIME_CAPS = [15, 20, 30] as const;
export type TimeCap = (typeof TIME_CAPS)[number];
export type Sort = 'newest' | 'shortest' | 'az';
export type Filters = { q: string; max: TimeCap | null; tags: string[]; sort: Sort };

export const EMPTY_FILTERS: Filters = { q: '', max: null, tags: [], sort: 'newest' };

const normalize = (tag: string) => tag.replace(/^#/, '').trim().toLowerCase();

/** Filters from a URL's query string (?q=, ?max=15, ?tag=a&tag=b, ?sort=shortest). */
export function filtersFromParams(params: URLSearchParams): Filters {
  const max = Number(params.get('max'));
  const sort = params.get('sort');
  return {
    q: (params.get('q') ?? '').trim(),
    max: (TIME_CAPS as readonly number[]).includes(max) ? (max as TimeCap) : null,
    tags: params.getAll('tag').map(normalize).filter(Boolean),
    sort: sort === 'shortest' || sort === 'az' ? sort : 'newest',
  };
}

/** The query string for a set of filters, without defaults. */
export function paramsFromFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.max) p.set('max', String(f.max));
  f.tags.forEach((t) => p.append('tag', t));
  if (f.sort !== 'newest') p.set('sort', f.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

const tagsOfTask = (t: FeedTask) => [
  ...new Set([...(t.sourceTags ?? []), ...t.tags].map(normalize)),
];

/** Every tag in the feed, most used first. */
export function feedTags(tasks: FeedTask[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  tasks.forEach((t) => tagsOfTask(t).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function applyFilters<T extends FeedTask>(tasks: T[], f: Filters): T[] {
  const q = f.q.toLowerCase();
  const out = tasks.filter((t) => {
    const tags = tagsOfTask(t);
    if (q && ![t.title, t.shortDescription, ...tags].some((s) => s.toLowerCase().includes(q)))
      return false;
    if (f.max && !(typeof t.estimatedMinutes === 'number' && t.estimatedMinutes <= f.max))
      return false;
    return f.tags.every((tag) => tags.includes(tag));
  });
  if (f.sort === 'shortest')
    return [...out].sort(
      (a, b) => (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity),
    );
  if (f.sort === 'az') return [...out].sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export const hasFilters = (f: Filters) =>
  !!f.q || f.max !== null || f.tags.length > 0 || f.sort !== 'newest';
