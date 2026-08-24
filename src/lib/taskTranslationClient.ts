import type { Locale } from '$lib/locale';

export type DisplayTask = {
  id: string;
  title: string;
  shortDescription: string;
  description?: string;
  tags: string[];
  language?: string;
  translation: { locale: Locale; status: 'original' | 'translated' | 'fallback' };
};

export async function translateTaskBatch(tasks: DisplayTask[], locale: Locale): Promise<DisplayTask[]> {
  if (locale === 'en' || tasks.length === 0) {
    return tasks.map((task) => ({ ...task, translation: { locale, status: 'original' } }));
  }

  try {
    const response = await fetch('/api/tasks/translation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ taskIds: tasks.map((task) => task.id), locale })
    });
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const payload = (await response.json()) as { tasks?: DisplayTask[] };
    const translated = new Map((payload.tasks ?? []).map((task) => [task.id, task]));
    return tasks.map((task) => translated.get(task.id) ?? {
      ...task,
      translation: { locale, status: 'fallback' }
    });
  } catch {
    return tasks.map((task) => ({ ...task, translation: { locale, status: 'fallback' } }));
  }
}
