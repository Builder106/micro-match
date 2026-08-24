import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, formatRelativeTime } from './formatters';

describe('locale-aware formatters', () => {
	it('formats numbers using the requested locale', () => {
		expect(formatNumber(1234567.89, 'en')).toBe('1,234,567.89');
		expect(formatNumber(1234567.89, 'de')).toBe('1.234.567,89');
	});

	it.each(['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar'] as const)('supports planned locale %s', (locale) => {
		expect(formatNumber(42, locale)).toBeTruthy();
	});

	it('supports explicit number formatting options', () => {
		expect(formatNumber(0.456, 'en', { style: 'percent' })).toBe('46%');
	});

	it('formats dates without relying on the process locale', () => {
		const date = new Date('2025-01-15T12:00:00.000Z');

		expect(formatDate(date, 'en', { timeZone: 'UTC', dateStyle: 'medium' })).toBe('Jan 15, 2025');
		expect(formatDate(date, 'fr', { timeZone: 'UTC', dateStyle: 'medium' })).toBe('15 janv. 2025');
	});

	it('accepts date-like input and explicit time-zone options', () => {
		expect(
			formatDate('2025-01-15T12:00:00.000Z', 'en', {
				timeZone: 'UTC',
				dateStyle: 'short'
			})
		).toBe('1/15/25');
	});

	it('uses locale-aware relative-time wording', () => {
		expect(formatRelativeTime(-1, 'day', 'en')).toBe('yesterday');
		expect(formatRelativeTime(-1, 'day', 'es')).toBe('ayer');
		expect(formatRelativeTime(2, 'hour', 'en')).toBe('in 2 hours');
	});

	it('falls back to English for unsupported locale input', () => {
		expect(formatNumber(1234.5, 'not-a-locale')).toBe('1,234.5');
		expect(formatNumber(1234.5, 'xx')).toBe('1,234.5');
	});
});
