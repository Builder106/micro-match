import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '$lib/types';

const { translateTexts } = vi.hoisted(() => ({
  translateTexts: vi.fn()
}));
vi.mock('$lib/server/libretranslate', () => ({ translateTexts }));

import { isSupportedTaskLocale, translateTask, translateTasks } from './taskTranslation';

const task: Task = {
  id: 'task-1',
  title: 'Tag photos',
  shortDescription: 'Add tags',
  description: 'Tag each photo.',
  language: 'English',
  tags: ['data', 'history']
};

describe('task translation helper', () => {
  beforeEach(() => translateTexts.mockReset());

  it('validates supported task locales', () => {
    expect(isSupportedTaskLocale('en')).toBe(true);
    expect(isSupportedTaskLocale('es')).toBe(true);
    expect(isSupportedTaskLocale('fr')).toBe(true);
    expect(isSupportedTaskLocale('invalid')).toBe(false);
    expect(isSupportedTaskLocale(null)).toBe(false);
    expect(isSupportedTaskLocale(123)).toBe(false);
  });

  it('bypasses LibreTranslate for English and preserves the source language', async () => {
    await expect(translateTask(task, 'en')).resolves.toEqual({
      ...task,
      translation: { locale: 'en', status: 'original' }
    });
    expect(translateTexts).not.toHaveBeenCalled();
  });

  it('returns translated display fields and metadata without changing language', async () => {
    translateTexts.mockResolvedValueOnce(['Etiquetar', 'Añadir etiquetas', 'Etiquete cada foto.', 'datos', 'historia']);
    await expect(translateTask(task, 'es')).resolves.toEqual({
      ...task,
      title: 'Etiquetar',
      shortDescription: 'Añadir etiquetas',
      description: 'Etiquete cada foto.',
      tags: ['datos', 'historia'],
      translation: { locale: 'es', status: 'translated' }
    });
  });

  it('marks provider fallback while retaining the original fields', async () => {
    translateTexts.mockResolvedValueOnce([task.title, task.shortDescription, task.description, ...task.tags]);
    await expect(translateTask(task, 'fr')).resolves.toEqual({
      ...task,
      translation: { locale: 'fr', status: 'fallback' }
    });

    // Test when task.description is undefined
    const taskNoDesc: Task = { id: 'task-no-desc', title: 'T', shortDescription: 'S', tags: [] };
    translateTexts.mockResolvedValueOnce(['T-es', 'S-es']);
    const resNoDesc = await translateTask(taskNoDesc, 'es');
    expect(resNoDesc.description).toBeUndefined();
    expect(resNoDesc.translation.status).toBe('translated');
  });

  it('does not expose provider credentials through the helper result', async () => {
    translateTexts.mockResolvedValueOnce(['Titre', 'Résumé', 'Description', 'tag']);
    const result = await translateTask({ ...task, tags: ['tag'] }, 'fr');
    expect(JSON.stringify(result)).not.toContain('LIBRETRANSLATE_API_KEY');
    expect(JSON.stringify(result)).not.toContain('server-only-key');
  });

  it('handles batch translateTasks for English and empty lists without API call', async () => {
    await expect(translateTasks([], 'es')).resolves.toEqual([]);
    await expect(translateTasks([task], 'en')).resolves.toEqual([
      { ...task, translation: { locale: 'en', status: 'original' } }
    ]);
    expect(translateTexts).not.toHaveBeenCalled();
  });

  it('translates multiple tasks in batch and handles fallback when untranslated', async () => {
    const task2: Task = {
      id: 'task-2',
      title: 'Review docs',
      shortDescription: 'Check text',
      tags: ['docs']
    };
    translateTexts.mockResolvedValueOnce([
      'Etiquetar', 'Añadir', 'Detalle', 'datos', 'historia',
      'Revisar', 'Verificar', 'docs'
    ]);
    const res = await translateTasks([task, task2], 'es');
    expect(res).toHaveLength(2);
    expect(res[0].translation.status).toBe('translated');
    expect(res[0].title).toBe('Etiquetar');
    expect(res[1].title).toBe('Revisar');
    expect(res[1].description).toBeUndefined();

    // Fallback case when translated matches original
    translateTexts.mockResolvedValueOnce([task.title, task.shortDescription, task.description, ...task.tags]);
    const fallbackRes = await translateTasks([task], 'fr');
    expect(fallbackRes[0].translation.status).toBe('fallback');
  });
});
