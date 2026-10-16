import { describe, it, expect } from 'vitest';
import { COUNTRIES, countryName, taxIdLabel } from './verification';

describe('verification helpers', () => {
  it('names each country registration number', () => {
    expect(taxIdLabel('US')).toMatch(/EIN/);
    expect(taxIdLabel('GB')).toMatch(/Charity Commission/);
    expect(taxIdLabel('CA')).toMatch(/CRA/);
    expect(taxIdLabel('KE')).toBe('Registration or charity number');
  });
  it('reads country codes back as names', () => {
    expect(COUNTRIES[COUNTRIES.length - 1].code).toBe('OTHER');
    expect(countryName('NG')).toBe('Nigeria');
    expect(countryName('ZZ')).toBe('Somewhere else');
    expect(countryName('JP')).toBe('JP');
  });
});
