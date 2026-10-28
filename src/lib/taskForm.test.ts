import { describe, it, expect } from 'vitest';
import { LIMITS, TASK_MINUTES, parseTags } from './taskForm';

describe('task form', () => {
  it('offers 5 to 30 minutes', () => {
    expect(TASK_MINUTES[0]).toBe(5);
    expect(TASK_MINUTES[TASK_MINUTES.length - 1]).toBe(30);
    expect(LIMITS.title).toBe(140);
  });
  it('cleans and de-duplicates tags', () => {
    expect(parseTags('translation, #Health, , health, Design ')).toEqual([
      'translation',
      'health',
      'design',
    ]);
    expect(parseTags('')).toEqual([]);
  });
});
