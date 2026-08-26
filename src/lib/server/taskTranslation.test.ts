import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '$lib/types';

const { translateTexts } = vi.hoisted(() => ({
  translateTexts: vi.fn()
}));
vi.mock('$lib/server/libretranslate', () => ({ translateTexts }));

import { translateTask } from './taskTranslation';

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
  });

  it('does not expose provider credentials through the helper result', async () => {
    translateTexts.mockResolvedValueOnce(['Titre', 'Résumé', 'Description', 'tag']);
    const result = await translateTask({ ...task, tags: ['tag'] }, 'fr');
    expect(JSON.stringify(result)).not.toContain('LIBRETRANSLATE_API_KEY');
    expect(JSON.stringify(result)).not.toContain('server-only-key');
  });
});
