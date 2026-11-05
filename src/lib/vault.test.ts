import { describe, expect, it } from 'vitest';
import { maskEmail, parseClaimInput, parseDisplayName, parseHandle } from './vault';

const today = new Date('2026-11-04T12:00:00Z');
const form = (fields: Record<string, string>) =>
  new Map(Object.entries(fields)) as unknown as FormData;
const good = {
  volunteerName: 'Jane  Doe',
  orgName: 'Riverside Food Pantry',
  contactEmail: ' Pat@Riverside.ORG ',
  description: 'Sorted donations every Saturday morning.',
};

describe('parseClaimInput', () => {
  it('accepts the required fields, trims, lowercases the address and collapses name whitespace', () => {
    expect(parseClaimInput(form(good), today)).toEqual({
      ok: true,
      value: {
        volunteerName: 'Jane Doe',
        orgName: 'Riverside Food Pantry',
        contactEmail: 'pat@riverside.org',
        description: 'Sorted donations every Saturday morning.',
      },
    });
  });

  it('keeps an optional date and minutes', () => {
    const result = parseClaimInput(form({ ...good, date: '2026-10-03', minutes: '90' }), today);
    expect(result).toMatchObject({ ok: true, value: { date: '2026-10-03', minutes: 90 } });
  });

  it('flags every bad field at once', () => {
    const result = parseClaimInput(
      form({
        volunteerName: 'J',
        orgName: '',
        contactEmail: 'nope',
        description: 'short',
        date: '2099-01-01',
        minutes: '0',
      }),
      today,
    );
    expect(result).toEqual({
      ok: false,
      errors: ['volunteerName', 'orgName', 'contactEmail', 'description', 'date', 'minutes'],
    });
  });

  it('treats missing fields as empty', () => {
    const result = parseClaimInput(new Map() as unknown as FormData, today);
    expect(result.ok).toBe(false);
  });

  it.each(['2026-00-10', '26-10-03', '1980-01-01', 'yesterday'])('rejects the date %s', (date) => {
    expect(parseClaimInput(form({ ...good, date }), today)).toEqual({
      ok: false,
      errors: ['date'],
    });
  });

  it('accepts today as a date', () => {
    expect(parseClaimInput(form({ ...good, date: '2026-11-04' }), today).ok).toBe(true);
  });

  it.each(['1.5', 'abc', '60001'])('rejects the minutes %s', (minutes) => {
    expect(parseClaimInput(form({ ...good, minutes }), today)).toEqual({
      ok: false,
      errors: ['minutes'],
    });
  });

  it('rejects an address that is too long', () => {
    const long = `${'a'.repeat(250)}@x.org`;
    expect(parseClaimInput(form({ ...good, contactEmail: long }), today)).toEqual({
      ok: false,
      errors: ['contactEmail'],
    });
  });
});

describe('maskEmail', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('jane.doe@school.org')).toBe('j***@school.org');
  });
});

describe('parseHandle', () => {
  it('lowercases and accepts letters, digits and single hyphens', () => {
    expect(parseHandle(' Jane-Doe42 ')).toBe('jane-doe42');
  });

  it.each(['ab', 'a'.repeat(31), '-jane', 'jane-', 'ja--ne', 'ja ne', 'jané', 'admin', 'vault'])(
    'rejects %s',
    (value) => {
      expect(parseHandle(value)).toBeNull();
    },
  );
});

describe('parseDisplayName', () => {
  it('uses the trimmed name, cut to 60 characters', () => {
    expect(parseDisplayName('  Jane Doe ', 'jane')).toBe('Jane Doe');
    expect(parseDisplayName('x'.repeat(80), 'jane')).toHaveLength(60);
  });

  it('falls back when the name is blank', () => {
    expect(parseDisplayName('   ', 'jane')).toBe('jane');
  });
});
