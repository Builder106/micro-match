export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ar';

const fallbackLocale: SupportedLocale = 'en';
const supportedLocales = new Set<SupportedLocale>(['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar']);

function localeOrFallback(locale: string): SupportedLocale {
	return supportedLocales.has(locale as SupportedLocale) ? (locale as SupportedLocale) : fallbackLocale;
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat(localeOrFallback(locale), options).format(value);
}

export function formatDate(
	value: Date | number | string,
	locale: string,
	options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
	return new Intl.DateTimeFormat(localeOrFallback(locale), options).format(new Date(value));
}

export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale: string): string {
	return new Intl.RelativeTimeFormat(localeOrFallback(locale), { numeric: 'auto' }).format(value, unit);
}
