import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateTaskBatch, type DisplayTask } from './taskTranslationClient';

const mockTasks: DisplayTask[] = [
  {
    id: 't1',
    title: 'Task 1',
    shortDescription: 'Desc 1',
    tags: [],
    translation: { locale: 'en', status: 'original' }
  }
];

describe('translateTaskBatch', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns original if locale is en', async () => {
    const result = await translateTaskBatch(mockTasks, 'en');
    expect(result[0].translation.status).toBe('original');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns original if tasks is empty', async () => {
    const result = await translateTaskBatch([], 'es');
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls fetch and maps translation correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        tasks: [
          { ...mockTasks[0], title: 'Tarea 1', translation: { locale: 'es', status: 'translated' } }
        ]
      })
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await translateTaskBatch(mockTasks, 'es');
    expect(result[0].title).toBe('Tarea 1');
    expect(result[0].translation.status).toBe('translated');
  });

  it('handles payload.tasks missing gracefully', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({}) // missing tasks array
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await translateTaskBatch(mockTasks, 'es');
    expect(result[0].translation.status).toBe('fallback');
  });

  it('handles missing translated task in payload', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        tasks: [] // returned empty array
      })
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await translateTaskBatch(mockTasks, 'es');
    expect(result[0].translation.status).toBe('fallback');
  });

  it('handles fetch failure', async () => {
    const mockResponse = {
      ok: false,
      status: 500
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await translateTaskBatch(mockTasks, 'es');
    expect(result[0].translation.status).toBe('fallback');
  });

  it('handles fetch exception', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

    const result = await translateTaskBatch(mockTasks, 'es');
    expect(result[0].translation.status).toBe('fallback');
  });
});
