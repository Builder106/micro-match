import { describe, it, expect } from 'vitest';
import { NOTES_MAX, isHttpUrl } from './claim';

describe('isHttpUrl', () => {
  it('accepts full http and https links only', () => {
    expect(isHttpUrl(' https://docs.example.org/x ')).toBe(true);
    expect(isHttpUrl('http://example.org')).toBe(true);
    expect(isHttpUrl('ftp://example.org')).toBe(false);
    expect(isHttpUrl('docs.example.org')).toBe(false);
    expect(isHttpUrl('   ')).toBe(false);
    expect(NOTES_MAX).toBe(1000);
  });
});
