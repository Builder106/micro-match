import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateTaskBatch, type DisplayTask } from '$lib/taskTranslationClient';

const sampleTask: DisplayTask = {
  id: 'task-1',
  title: 'Original Title',
  shortDescription: 'Original Short',
  description: 'Original Description',
  tags: ['urgent'],
  translation: { locale: 'en', status: 'original' }
};

describe('translateTaskBatch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns original tasks when locale is en or tasks array is empty', async () => {
    expect(await translateTaskBatch([], 'es')).toEqual([]);
    expect(await translateTaskBatch([sampleTask], 'en')).toEqual([
      { ...sampleTask, translation: { locale: 'en', status: 'original' } }
    ]);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('translates tasks successfully when API returns valid response', async () => {
    const translatedTask: DisplayTask = {
      ...sampleTask,
      title: 'Título Traducido',
      translation: { locale: 'es', status: 'translated' }
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ tasks: [translatedTask] }), { status: 200 })
    );

    const result = await translateTaskBatch([sampleTask], 'es');
    expect(result).toEqual([translatedTask]);
  });

  it('falls back when API returns non-ok status or network error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('Error', { status: 500 })
    );
    const result500 = await translateTaskBatch([sampleTask], 'fr');
    expect(result500[0].translation).toEqual({ locale: 'fr', status: 'fallback' });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );
    const resultError = await translateTaskBatch([sampleTask], 'de');
    expect(resultError[0].translation).toEqual({ locale: 'de', status: 'fallback' });
  });

  it('falls back for individual tasks omitted in API response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ tasks: [] }), { status: 200 })
    );
    const result = await translateTaskBatch([sampleTask], 'pt');
    expect(result[0].translation).toEqual({ locale: 'pt', status: 'fallback' });
  });
});
