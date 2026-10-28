import { describe, it, expect } from 'vitest';
import { richParts } from './rich';

describe('richParts', () => {
  it('splits tagged pieces out of a sentence', () => {
    expect(richParts('Read <docs>the guide</docs> or <code>GET /api</code>.')).toEqual([
      { tag: null, text: 'Read ' },
      { tag: 'docs', text: 'the guide' },
      { tag: null, text: ' or ' },
      { tag: 'code', text: 'GET /api' },
      { tag: null, text: '.' },
    ]);
  });
  it('keeps text without tags whole, and a sentence that is all one tag', () => {
    expect(richParts('Plain words.')).toEqual([{ tag: null, text: 'Plain words.' }]);
    expect(richParts('<a>Only a link</a>')).toEqual([{ tag: 'a', text: 'Only a link' }]);
  });
});
