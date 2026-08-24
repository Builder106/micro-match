import type { Task } from '$lib/types';
import { isSupportedTranslationCode, type TranslationCode } from '$lib/translation';
import { translateTexts } from '$lib/server/libretranslate';

export type Locale = Exclude<TranslationCode, ''> | 'en';

export type TaskTranslationMeta = {
  locale: Locale;
  status: 'original' | 'translated' | 'fallback';
};

export type TranslatedTaskFields = Pick<Task, 'title' | 'shortDescription' | 'description' | 'tags'>;

export type TranslatedTask = Task & {
  translation: TaskTranslationMeta;
};

export const MAX_TASK_TRANSLATION_BATCH_SIZE = 50;

export function isSupportedTaskLocale(value: unknown): value is Locale {
  return value === 'en' || (typeof value === 'string' && isSupportedTranslationCode(value));
}

function fieldsFor(task: Task): string[] {
  return [task.title, task.shortDescription, task.description ?? '', ...task.tags];
}

export async function translateTask(task: Task, locale: Locale): Promise<TranslatedTask> {
  if (locale === 'en') {
    return { ...task, translation: { locale, status: 'original' } };
  }

  const original = fieldsFor(task);
  const translated = await translateTexts({ texts: original, to: locale });
  const [title, shortDescription, description, ...tags] = translated;
  const changed = translated.some((value, index) => value !== original[index]);

  return {
    ...task,
    title,
    shortDescription,
    description: task.description === undefined ? undefined : description,
    tags,
    translation: { locale, status: changed ? 'translated' : 'fallback' }
  };
}

export async function translateTasks(tasks: Task[], locale: Locale): Promise<TranslatedTask[]> {
  if (locale === 'en' || tasks.length === 0) {
    return tasks.map((task) => ({ ...task, translation: { locale, status: 'original' } }));
  }

  const originals = tasks.map(fieldsFor);
  const translated = await translateTexts({
    texts: originals.flat(),
    to: locale
  });

  let offset = 0;
  return tasks.map((task, index) => {
    const original = originals[index];
    const fields = translated.slice(offset, offset + original.length);
    offset += original.length;
    const [title, shortDescription, description, ...tags] = fields;
    const changed = fields.some((value, fieldIndex) => value !== original[fieldIndex]);
    return {
      ...task,
      title,
      shortDescription,
      description: task.description === undefined ? undefined : description,
      tags,
      translation: { locale, status: changed ? 'translated' : 'fallback' }
    };
  });
}
