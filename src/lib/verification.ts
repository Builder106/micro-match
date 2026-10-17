// Countries offered on the verification form and what each calls its registration number.
export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'IN', name: 'India' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'OTHER', name: 'Somewhere else' }
] as const;

export function taxIdLabel(country: string): string {
  if (country === 'US') return 'EIN (federal tax ID)';
  if (country === 'GB') return 'Charity Commission number';
  if (country === 'CA') return 'CRA charity registration number';
  return 'Registration or charity number';
}

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? (code === 'ZZ' ? 'Somewhere else' : code);
}
