export const TRANSLATION_OPTIONS = [
  { code: '', label: 'Original' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' }
] as const;

export type TranslationCode = (typeof TRANSLATION_OPTIONS)[number]['code'];

const SUPPORTED_TRANSLATION_CODES: ReadonlySet<string> = new Set(
  TRANSLATION_OPTIONS.map(({ code }) => code).filter(Boolean)
);

export function isSupportedTranslationCode(value: string): value is Exclude<TranslationCode, ''> {
  return SUPPORTED_TRANSLATION_CODES.has(value);
}

type TaskDetailCopy = {
  backToFeed: string;
  postedBy: string;
  verified: string;
  unverified: string;
  autoTranslated: string;
  minutes: string;
  max: string;
  theMission: string;
  translationNotice: string;
  noDescription: string;
  signInToClaimTask: string;
  signInToClaim: string;
  readyToHelp: string;
  claimTask: string;
};

const TASK_DETAIL_COPY: Record<Exclude<TranslationCode, ''>, TaskDetailCopy> = {
  es: {
    backToFeed: 'Volver a las tareas', postedBy: 'Publicado por', verified: 'Verificado', unverified: 'Sin verificar', autoTranslated: 'Traducido automáticamente', minutes: 'min', max: 'Máximo', theMission: 'La misión', translationNotice: 'Traducción automática. Comprueba los matices con el original antes de enviarlo.', noDescription: 'No se proporcionó una descripción detallada.', signInToClaimTask: 'Inicia sesión para reclamar esta tarea.', signInToClaim: 'Iniciar sesión para reclamarla', readyToHelp: '¿Listo para ayudar?', claimTask: 'Reclamar esta tarea'
  },
  fr: {
    backToFeed: 'Retour aux tâches', postedBy: 'Publié par', verified: 'Vérifié', unverified: 'Non vérifié', autoTranslated: 'Traduit automatiquement', minutes: 'min', max: 'Maximum', theMission: 'La mission', translationNotice: 'Traduction automatique. Vérifiez les nuances avec l’original avant de répondre.', noDescription: 'Aucune description détaillée n’a été fournie.', signInToClaimTask: 'Connectez-vous pour réclamer cette tâche.', signInToClaim: 'Se connecter pour la réclamer', readyToHelp: 'Prêt à aider ?', claimTask: 'Réclamer cette tâche'
  },
  de: {
    backToFeed: 'Zurück zu den Aufgaben', postedBy: 'Veröffentlicht von', verified: 'Verifiziert', unverified: 'Nicht verifiziert', autoTranslated: 'Automatisch übersetzt', minutes: 'Min.', max: 'Maximal', theMission: 'Die Aufgabe', translationNotice: 'Automatisch übersetzt. Prüfe die Bedeutung vor dem Absenden mit dem Original.', noDescription: 'Es wurde keine ausführliche Beschreibung angegeben.', signInToClaimTask: 'Melde dich an, um diese Aufgabe zu übernehmen.', signInToClaim: 'Anmelden und übernehmen', readyToHelp: 'Bereit zu helfen?', claimTask: 'Aufgabe übernehmen'
  },
  pt: {
    backToFeed: 'Voltar às tarefas', postedBy: 'Publicado por', verified: 'Verificado', unverified: 'Não verificado', autoTranslated: 'Traduzido automaticamente', minutes: 'min', max: 'Máximo', theMission: 'A missão', translationNotice: 'Tradução automática. Confira as nuances no original antes de enviar.', noDescription: 'Não foi fornecida uma descrição detalhada.', signInToClaimTask: 'Entre para assumir esta tarefa.', signInToClaim: 'Entrar para assumir', readyToHelp: 'Pronto para ajudar?', claimTask: 'Assumir esta tarefa'
  },
  zh: {
    backToFeed: '返回任务列表', postedBy: '发布者', verified: '已验证', unverified: '未验证', autoTranslated: '自动翻译', minutes: '分钟', max: '最多', theMission: '任务说明', translationNotice: '此内容由机器翻译。提交前请对照原文核对意思。', noDescription: '未提供详细说明。', signInToClaimTask: '登录后即可认领此任务。', signInToClaim: '登录并认领', readyToHelp: '准备好帮忙了吗？', claimTask: '认领此任务'
  },
  ar: {
    backToFeed: 'العودة إلى المهام', postedBy: 'نشرها', verified: 'موثّق', unverified: 'غير موثّق', autoTranslated: 'مترجم آليًا', minutes: 'دقيقة', max: 'الحد الأقصى', theMission: 'المهمة', translationNotice: 'هذه ترجمة آلية. راجع المعنى مقابل النص الأصلي قبل الإرسال.', noDescription: 'لم يتم تقديم وصف تفصيلي.', signInToClaimTask: 'سجّل الدخول لتولي هذه المهمة.', signInToClaim: 'سجّل الدخول لتوليها', readyToHelp: 'هل أنت مستعد للمساعدة؟', claimTask: 'تولَّ هذه المهمة'
  }
};

const ORIGINAL_TASK_DETAIL_COPY: TaskDetailCopy = {
  backToFeed: 'Back to feed',
  postedBy: 'Posted by',
  verified: 'Verified',
  unverified: 'Unverified',
  autoTranslated: 'Auto-translated',
  minutes: 'min',
  max: 'Max',
  theMission: 'The mission',
  translationNotice: 'Auto-translated. Verify nuance against the original before submitting.',
  noDescription: 'No detailed description was provided.',
  signInToClaimTask: 'Sign in to claim this task.',
  signInToClaim: 'Sign in to claim',
  readyToHelp: 'Ready to help?',
  claimTask: 'Claim this task'
};

export function getTaskDetailCopy(language: string | null): TaskDetailCopy {
  return language && isSupportedTranslationCode(language)
    ? TASK_DETAIL_COPY[language]
    : ORIGINAL_TASK_DETAIL_COPY;
}
