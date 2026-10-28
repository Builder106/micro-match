import { defaultLocale, directionForLocale, localizedPath, type Locale } from '$lib/locale';

type MessageCopy = {
  subject: string;
  preheader: string;
  heading: string;
  body: (orgName: string) => string;
  reasonLabel?: string;
  followUp?: string;
  action: string;
  fallback: string;
  footer: string;
};

type EmailCopy = {
  approved: MessageCopy;
  rejected: MessageCopy;
};

const copy: Record<Locale, EmailCopy> = {
  en: {
    approved: {
      subject: 'Your organization is verified',
      preheader: 'Your organization can now post verified tasks.',
      heading: 'Your organization is verified',
      body: (orgName) =>
        `${organization(orgName)} is now verified on MicroMatch. Tasks you post will show a Verified label so volunteers know your organization has been reviewed.`,
      action: 'Post a task',
      fallback: "If the button doesn't work, use this link:",
      footer: 'You received this email because you submitted an NGO verification on MicroMatch.',
    },
    rejected: {
      subject: 'One change is needed for verification',
      preheader: 'Review the note and update your submission.',
      heading: 'Your verification needs an update',
      body: (orgName) =>
        `We reviewed ${organization(orgName)} and need this change before we can approve it.`,
      reasonLabel: 'Requested change',
      followUp: 'You can make this change and resubmit from your profile.',
      action: 'Update verification',
      fallback: "If the button doesn't work, use this link:",
      footer: 'You received this email because you submitted an NGO verification on MicroMatch.',
    },
  },
  es: {
    approved: {
      subject: 'Tu organización está verificada',
      preheader: 'Tu organización ya puede publicar tareas verificadas.',
      heading: 'Tu organización está verificada',
      body: (orgName) =>
        `${organization(orgName)} ya está verificada en MicroMatch. Las tareas que publiques mostrarán la etiqueta Verificada para que las personas voluntarias sepan que revisamos la organización.`,
      action: 'Publicar una tarea',
      fallback: 'Si el botón no funciona, usa este enlace:',
      footer:
        'Recibes este correo porque enviaste una solicitud de verificación para una ONG en MicroMatch.',
    },
    rejected: {
      subject: 'Hace falta un cambio para completar la verificación',
      preheader: 'Lee la nota y actualiza tu solicitud.',
      heading: 'Tu verificación necesita una actualización',
      body: (orgName) =>
        `Revisamos ${organization(orgName)} y necesitamos este cambio para aprobarla.`,
      reasonLabel: 'Cambio solicitado',
      followUp: 'Puedes hacer el cambio y volver a enviar la solicitud desde tu perfil.',
      action: 'Actualizar verificación',
      fallback: 'Si el botón no funciona, usa este enlace:',
      footer:
        'Recibes este correo porque enviaste una solicitud de verificación para una ONG en MicroMatch.',
    },
  },
  fr: {
    approved: {
      subject: 'Votre organisation est vérifiée',
      preheader: 'Votre organisation peut maintenant publier des missions vérifiées.',
      heading: 'Votre organisation est vérifiée',
      body: (orgName) =>
        `${organization(orgName)} est maintenant vérifiée sur MicroMatch. Les missions que vous publiez porteront la mention Vérifiée pour indiquer aux bénévoles que votre organisation a été examinée.`,
      action: 'Publier une mission',
      fallback: 'Si le bouton ne fonctionne pas, utilisez ce lien :',
      footer:
        "Vous recevez ce message car vous avez envoyé une demande de vérification d'organisation à MicroMatch.",
    },
    rejected: {
      subject: 'Une modification est nécessaire pour la vérification',
      preheader: 'Lisez la note et modifiez votre demande.',
      heading: 'Votre demande de vérification doit être modifiée',
      body: (orgName) =>
        `Nous avons examiné ${organization(orgName)}. Cette modification est nécessaire avant son approbation.`,
      reasonLabel: 'Modification demandée',
      followUp: 'Vous pourrez modifier votre demande et la renvoyer depuis votre profil.',
      action: 'Modifier la vérification',
      fallback: 'Si le bouton ne fonctionne pas, utilisez ce lien :',
      footer:
        "Vous recevez ce message car vous avez envoyé une demande de vérification d'organisation à MicroMatch.",
    },
  },
  de: {
    approved: {
      subject: 'Ihre Organisation ist verifiziert',
      preheader: 'Ihre Organisation kann jetzt verifizierte Aufgaben veröffentlichen.',
      heading: 'Ihre Organisation ist verifiziert',
      body: (orgName) =>
        `${organization(orgName)} ist jetzt auf MicroMatch verifiziert. Ihre Aufgaben erhalten die Kennzeichnung Verifiziert, damit Freiwillige sehen, dass wir Ihre Organisation geprüft haben.`,
      action: 'Aufgabe veröffentlichen',
      fallback: 'Falls die Schaltfläche nicht funktioniert, verwenden Sie diesen Link:',
      footer:
        'Sie erhalten diese E-Mail, weil Sie bei MicroMatch eine Verifizierung für eine gemeinnützige Organisation beantragt haben.',
    },
    rejected: {
      subject: 'Für die Verifizierung ist eine Änderung nötig',
      preheader: 'Lesen Sie den Hinweis und aktualisieren Sie Ihren Antrag.',
      heading: 'Ihr Verifizierungsantrag muss aktualisiert werden',
      body: (orgName) =>
        `Wir haben ${organization(orgName)} geprüft. Vor der Freigabe ist diese Änderung nötig.`,
      reasonLabel: 'Gewünschte Änderung',
      followUp:
        'Sie können die Änderung in Ihrem Profil vornehmen und den Antrag erneut einreichen.',
      action: 'Verifizierung aktualisieren',
      fallback: 'Falls die Schaltfläche nicht funktioniert, verwenden Sie diesen Link:',
      footer:
        'Sie erhalten diese E-Mail, weil Sie bei MicroMatch eine Verifizierung für eine gemeinnützige Organisation beantragt haben.',
    },
  },
  pt: {
    approved: {
      subject: 'Sua organização foi verificada',
      preheader: 'Sua organização já pode publicar tarefas verificadas.',
      heading: 'Sua organização foi verificada',
      body: (orgName) =>
        `${organization(orgName)} agora está verificada no MicroMatch. As tarefas que você publicar terão o selo Verificada para que voluntários saibam que sua organização foi analisada.`,
      action: 'Publicar uma tarefa',
      fallback: 'Se o botão não funcionar, use este link:',
      footer:
        'Você recebeu este e-mail porque enviou uma solicitação de verificação de ONG ao MicroMatch.',
    },
    rejected: {
      subject: 'É preciso fazer uma alteração para concluir a verificação',
      preheader: 'Leia a observação e atualize sua solicitação.',
      heading: 'Sua verificação precisa de uma atualização',
      body: (orgName) =>
        `Analisamos ${organization(orgName)} e precisamos desta alteração antes de aprová-la.`,
      reasonLabel: 'Alteração solicitada',
      followUp: 'Você pode fazer a alteração e enviar a solicitação novamente pelo seu perfil.',
      action: 'Atualizar verificação',
      fallback: 'Se o botão não funcionar, use este link:',
      footer:
        'Você recebeu este e-mail porque enviou uma solicitação de verificação de ONG ao MicroMatch.',
    },
  },
  zh: {
    approved: {
      subject: '您的组织已通过认证',
      preheader: '您的组织现在可以发布已认证的任务。',
      heading: '您的组织已通过认证',
      body: (orgName) =>
        `${organization(orgName)} 已在 MicroMatch 完成认证。您发布的任务会显示已认证标记，让志愿者知道该组织已经过审核。`,
      action: '发布任务',
      fallback: '如果按钮无法使用，请打开此链接：',
      footer: '您收到此邮件是因为您在 MicroMatch 提交了非营利组织认证申请。',
    },
    rejected: {
      subject: '认证申请需要修改一项内容',
      preheader: '请查看说明并更新申请。',
      heading: '您的认证申请需要更新',
      body: (orgName) => `我们已审核${organization(orgName)}，批准前需要您完成以下修改。`,
      reasonLabel: '需要修改',
      followUp: '您可以在个人资料中完成修改并重新提交申请。',
      action: '更新认证申请',
      fallback: '如果按钮无法使用，请打开此链接：',
      footer: '您收到此邮件是因为您在 MicroMatch 提交了非营利组织认证申请。',
    },
  },
  ar: {
    approved: {
      subject: 'تم التحقق من مؤسستك',
      preheader: 'يمكن لمؤسستك الآن نشر مهام موثّقة.',
      heading: 'تم التحقق من مؤسستك',
      body: (orgName) =>
        `تم التحقق من ${organization(orgName)} على MicroMatch. ستظهر على المهام التي تنشرها علامة «موثّقة» ليعرف المتطوعون أن المؤسسة خضعت للمراجعة.`,
      action: 'انشر مهمة',
      fallback: 'إذا لم يعمل الزر، استخدم هذا الرابط:',
      footer: 'تتلقى هذا البريد لأنك أرسلت طلبًا للتحقق من مؤسسة غير ربحية على MicroMatch.',
    },
    rejected: {
      subject: 'يلزم تعديل لإكمال التحقق',
      preheader: 'راجع الملاحظة وحدّث طلبك.',
      heading: 'يحتاج طلب التحقق إلى تعديل',
      body: (orgName) =>
        `راجعنا طلب ${organization(orgName)} ونحتاج إلى هذا التعديل قبل الموافقة عليه.`,
      reasonLabel: 'التعديل المطلوب',
      followUp: 'يمكنك إجراء التعديل وإعادة إرسال الطلب من ملفك الشخصي.',
      action: 'حدّث طلب التحقق',
      fallback: 'إذا لم يعمل الزر، استخدم هذا الرابط:',
      footer: 'تتلقى هذا البريد لأنك أرسلت طلبًا للتحقق من مؤسسة غير ربحية على MicroMatch.',
    },
  },
};

type Patch = 'sewn' | 'pinned';

type RenderInput = {
  locale: Locale;
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  reasonLabel?: string;
  reason?: string;
  followUp?: string;
  action: string;
  fallback: string;
  footer: string;
  href: string;
  assetBase: string;
  patch: Patch;
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] as string,
  );
}

function escapeWithBreaks(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

// dir="auto" keeps a Latin name or note in its own direction inside Arabic copy, and the reverse.
function organization(orgName: string): string {
  return `<strong dir="auto">${escapeHtml(orgName)}</strong>`;
}

const SANS = "'Host Grotesk',Arial,Helvetica,sans-serif";
const DISPLAY = "'Bricolage Grotesque',Arial,Helvetica,sans-serif";
// Pads the inbox preview so clients do not pull body copy in after the preheader.
const PREHEADER_FILL = '&#847;&zwnj;&nbsp;'.repeat(40);

function renderMessage(input: RenderInput): string {
  const locale = input.locale;
  const direction = directionForLocale(locale);
  const alignment = direction === 'rtl' ? 'right' : 'left';
  const trailing = direction === 'rtl' ? 'left' : 'right';
  const href = escapeHtml(input.href);
  const asset = (name: string) => escapeHtml(`${input.assetBase}/email/${name}.png`);
  const reason = input.reason
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#F2B84B;border-radius:3px;">
      <tr><td style="padding:16px;color:#1C1F3B;font-family:${SANS};font-size:14px;line-height:1.5;text-align:${alignment};word-break:break-word;">
        <strong>${escapeHtml(input.reasonLabel!)}</strong>
        <div dir="auto" style="margin-top:4px;">${escapeWithBreaks(input.reason)}</div>
      </td></tr>
    </table>`
    : '';
  const followUp = input.followUp
    ? `<p style="margin:16px 0 0;color:#1C1F3B;font-family:${SANS};font-size:16px;line-height:1.55;text-align:${alignment};">${escapeHtml(input.followUp)}</p>`
    : '';

  return `<!doctype html>
<html lang="${locale}" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(input.subject)}</title>
    <style>
      @media only screen and (min-width: 600px) {
        .email-inner { padding: 32px !important; }
      }
    </style>
  </head>
  <body dir="${direction}" style="margin:0;padding:0;background:#FFFFFF;color:#1C1F3B;font-family:${SANS};">
    <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${escapeHtml(input.preheader)}${PREHEADER_FILL}</div>
    <table role="presentation" dir="${direction}" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:20px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #D9DCE8;border-radius:3px;background:#FFFFFF;">
          <tr><td class="email-inner" style="padding:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px dashed #575B76;">
              <tr>
                <td style="padding:0 0 16px;color:#1C1F3B;font-family:${DISPLAY};font-size:18px;font-weight:700;line-height:1.3;text-align:${alignment};vertical-align:middle;">MicroMatch</td>
                <td width="48" height="48" style="width:48px;height:48px;padding:0 0 16px;background-image:url('${asset(`patch-${input.patch}`)}');background-position:${trailing} top;background-repeat:no-repeat;background-size:48px 48px;"></td>
              </tr>
            </table>
            <h1 style="margin:24px 0 12px;color:#1C1F3B;font-family:${DISPLAY};font-size:24px;font-weight:700;line-height:1.25;text-align:${alignment};word-break:break-word;">${escapeHtml(input.heading)}</h1>
            <div style="color:#1C1F3B;font-family:${SANS};font-size:16px;line-height:1.55;text-align:${alignment};word-break:break-word;">
              <p style="margin:0;">${input.body}</p>
              ${reason}
              ${followUp}
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
              <tr><td bgcolor="#FF6B6B" style="border-radius:3px;background:#FF6B6B;">
                <a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:3px;color:#000000;font-family:${SANS};font-size:16px;font-weight:700;line-height:20px;text-align:center;text-decoration:none;">${escapeHtml(input.action)}</a>
              </td></tr>
            </table>
            <p style="margin:16px 0 0;color:#575B76;font-family:${SANS};font-size:14px;line-height:1.5;text-align:${alignment};">
              ${escapeHtml(input.fallback)}<br />
              <a href="${href}" dir="ltr" style="color:#1C1F3B;text-decoration:underline;word-break:break-all;">${href}</a>
            </p>
            <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #D9DCE8;color:#575B76;font-family:${SANS};font-size:12px;line-height:1.5;text-align:${alignment};">${escapeHtml(input.footer)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function render(
  orgName: string,
  appUrl: string,
  locale: Locale,
  rejected = false,
  reviewReason = '',
) {
  const message = copy[locale][rejected ? 'rejected' : 'approved'];
  const route = rejected ? '/profile' : '/org';
  const base = appUrl.replace(/\/$/, '');
  const href = `${base}${localizedPath(route, locale)}`;

  return {
    subject: message.subject,
    html: renderMessage({
      locale,
      subject: message.subject,
      preheader: message.preheader,
      heading: message.heading,
      body: message.body(orgName),
      reasonLabel: message.reasonLabel,
      reason: rejected ? reviewReason : undefined,
      followUp: message.followUp,
      action: message.action,
      fallback: message.fallback,
      footer: message.footer,
      href,
      assetBase: base,
      patch: rejected ? 'pinned' : 'sewn',
    }),
  };
}

export function renderVerificationApproved(
  orgName: string,
  appUrl: string,
  locale: Locale = defaultLocale,
) {
  return render(orgName, appUrl, locale);
}

export function renderVerificationRejected(
  orgName: string,
  reason: string,
  appUrl: string,
  locale: Locale = defaultLocale,
) {
  return render(orgName, appUrl, locale, true, reason);
}
