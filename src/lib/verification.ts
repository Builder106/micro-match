// Countries offered on the verification form and what each calls its registration number.
import * as m from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime.js';

export const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'NG', 'IN', 'KE', 'ZA', 'DE', 'FR', 'OTHER'] as const;

export function taxIdLabel(country: string): string {
  if (country === 'US') return m.tax_id_us();
  if (country === 'GB') return m.tax_id_gb();
  if (country === 'CA') return m.tax_id_ca();
  return m.tax_id_other();
}

/** A country code as a name in the visitor's language. "OTHER" and "ZZ" are somewhere else. */
export function countryName(code: string): string {
  if (code === 'OTHER' || code === 'ZZ') return m.country_other();
  try {
    // With the default fallback, an unknown but well-formed code comes back as itself.
    return new Intl.DisplayNames([getLocale()], { type: 'region' }).of(code) as string;
  } catch {
    return code;
  }
}
