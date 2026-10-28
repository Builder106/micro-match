import { describe, it, expect } from 'vitest';
import {
  EMPTY_FILTERS,
  applyFilters,
  feedTags,
  filtersFromParams,
  hasFilters,
  paramsFromFilters,
} from './feed';

const tasks = [
  {
    id: '1',
    title: 'Translate a flyer',
    shortDescription: 'Spanish for a clinic',
    tags: ['translation', '#Health'],
    estimatedMinutes: 15,
  },
  {
    id: '2',
    title: 'Audit alt text',
    shortDescription: 'Accessibility check',
    tags: ['design'],
    sourceTags: ['Design', 'data'],
    estimatedMinutes: 20,
  },
  { id: '3', title: 'Build a reference', shortDescription: 'Excel formulas', tags: ['data'] },
];

describe('feed filters', () => {
  it('reads and writes the query string', () => {
    const f = filtersFromParams(
      new URLSearchParams('q= flyer &max=15&tag=%23Health&tag=&sort=shortest'),
    );
    expect(f).toEqual({ q: 'flyer', max: 15, tags: ['health'], sort: 'shortest' });
    expect(paramsFromFilters(f)).toBe('?q=flyer&max=15&tag=health&sort=shortest');
    expect(filtersFromParams(new URLSearchParams('max=45&sort=nope'))).toEqual(EMPTY_FILTERS);
    expect(filtersFromParams(new URLSearchParams('sort=az')).sort).toBe('az');
    expect(paramsFromFilters(EMPTY_FILTERS)).toBe('');
  });
  it('counts tags across translated and source tags', () => {
    expect(feedTags(tasks)).toEqual([
      { tag: 'data', count: 2 },
      { tag: 'design', count: 1 },
      { tag: 'health', count: 1 },
      { tag: 'translation', count: 1 },
    ]);
  });
  it('searches, caps time and requires every chosen tag', () => {
    expect(applyFilters(tasks, { ...EMPTY_FILTERS, q: 'CLINIC' }).map((t) => t.id)).toEqual(['1']);
    expect(applyFilters(tasks, { ...EMPTY_FILTERS, q: 'health' }).map((t) => t.id)).toEqual(['1']);
    expect(applyFilters(tasks, { ...EMPTY_FILTERS, max: 15 }).map((t) => t.id)).toEqual(['1']);
    expect(
      applyFilters(tasks, { ...EMPTY_FILTERS, tags: ['data', 'design'] }).map((t) => t.id),
    ).toEqual(['2']);
  });
  it('sorts by length or title, unknown lengths last', () => {
    expect(applyFilters(tasks, { ...EMPTY_FILTERS, sort: 'shortest' }).map((t) => t.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(
      applyFilters([tasks[2], tasks[0]], { ...EMPTY_FILTERS, sort: 'shortest' }).map((t) => t.id),
    ).toEqual(['1', '3']);
    expect(applyFilters(tasks, { ...EMPTY_FILTERS, sort: 'az' }).map((t) => t.id)).toEqual([
      '2',
      '3',
      '1',
    ]);
  });
  it('knows when any filter is on', () => {
    expect(hasFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasFilters({ ...EMPTY_FILTERS, sort: 'az' })).toBe(true);
    expect(hasFilters({ ...EMPTY_FILTERS, max: 30 })).toBe(true);
  });
});
