import { describe, it, expect } from 'vitest';
import { isSupportedTranslationCode, getTaskDetailCopy } from './translation';

describe('translation utilities', () => {
  describe('isSupportedTranslationCode', () => {
    it('returns true for supported language codes', () => {
      expect(isSupportedTranslationCode('es')).toBe(true);
      expect(isSupportedTranslationCode('fr')).toBe(true);
      expect(isSupportedTranslationCode('de')).toBe(true);
      expect(isSupportedTranslationCode('pt')).toBe(true);
      expect(isSupportedTranslationCode('zh')).toBe(true);
      expect(isSupportedTranslationCode('ar')).toBe(true);
      expect(isSupportedTranslationCode('en')).toBe(false);
    });

    it('returns false for unsupported or empty language codes', () => {
      expect(isSupportedTranslationCode('')).toBe(false);
      expect(isSupportedTranslationCode('ja')).toBe(false);
      expect(isSupportedTranslationCode('invalid')).toBe(false);
    });
  });

  describe('getTaskDetailCopy', () => {
    it('returns the localized copy for supported languages', () => {
      const esCopy = getTaskDetailCopy('es');
      expect(esCopy.backToFeed).toBe('Volver a las tareas');
      expect(esCopy.claimTask).toBe('Reclamar esta tarea');

      const frCopy = getTaskDetailCopy('fr');
      expect(frCopy.backToFeed).toBe('Retour aux tâches');
      expect(frCopy.claimTask).toBe('Réclamer cette tâche');

      const deCopy = getTaskDetailCopy('de');
      expect(deCopy.backToFeed).toBe('Zurück zu den Aufgaben');
      expect(deCopy.claimTask).toBe('Aufgabe übernehmen');

      const ptCopy = getTaskDetailCopy('pt');
      expect(ptCopy.backToFeed).toBe('Voltar às tarefas');
      expect(ptCopy.claimTask).toBe('Assumir esta tarefa');

      const zhCopy = getTaskDetailCopy('zh');
      expect(zhCopy.backToFeed).toBe('返回任务列表');
      expect(zhCopy.claimTask).toBe('认领此任务');

      const arCopy = getTaskDetailCopy('ar');
      expect(arCopy.backToFeed).toBe('العودة إلى المهام');
      expect(arCopy.claimTask).toBe('تولَّ هذه المهمة');
    });

    it('provides localized original and translation controls for every locale', () => {
      expect(getTaskDetailCopy(null)).toMatchObject({
        viewOriginal: 'View original', viewTranslation: 'View translation', translationUnavailable: 'Translation unavailable.'
      });
      expect(getTaskDetailCopy('es')).toMatchObject({ viewOriginal: 'Ver original', viewTranslation: 'Ver traducción', translationUnavailable: 'La traducción no está disponible.' });
      expect(getTaskDetailCopy('fr')).toMatchObject({ viewOriginal: 'Voir l’original', viewTranslation: 'Voir la traduction', translationUnavailable: 'Traduction indisponible.' });
      expect(getTaskDetailCopy('de')).toMatchObject({ viewOriginal: 'Original anzeigen', viewTranslation: 'Übersetzung anzeigen', translationUnavailable: 'Übersetzung nicht verfügbar.' });
      expect(getTaskDetailCopy('pt')).toMatchObject({ viewOriginal: 'Ver original', viewTranslation: 'Ver tradução', translationUnavailable: 'Tradução indisponível.' });
      expect(getTaskDetailCopy('zh')).toMatchObject({ viewOriginal: '查看原文', viewTranslation: '查看译文', translationUnavailable: '翻译不可用。' });
      expect(getTaskDetailCopy('ar')).toMatchObject({ viewOriginal: 'عرض النص الأصلي', viewTranslation: 'عرض الترجمة', translationUnavailable: 'الترجمة غير متاحة.' });
    });

    it('returns original English fallback copy when language is null or empty', () => {
      const defaultCopyNull = getTaskDetailCopy(null);
      expect(defaultCopyNull.backToFeed).toBe('Back to feed');
      expect(defaultCopyNull.claimTask).toBe('Claim this task');

      const defaultCopyEmpty = getTaskDetailCopy('');
      expect(defaultCopyEmpty.backToFeed).toBe('Back to feed');
      expect(defaultCopyEmpty.claimTask).toBe('Claim this task');
    });

    it('returns original English fallback copy for unsupported languages', () => {
      const fallbackCopy = getTaskDetailCopy('unknown-locale');
      expect(fallbackCopy.backToFeed).toBe('Back to feed');
      expect(fallbackCopy.postedBy).toBe('Posted by');
      expect(fallbackCopy.verified).toBe('Verified');
      expect(fallbackCopy.unverified).toBe('Unverified');
    });
  });
});
