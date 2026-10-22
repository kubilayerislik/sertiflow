export const DEFAULT_MAIL_SUBJECT = '{kurs_adi} — Sertifikanız';

export const DEFAULT_MAIL_BODY = `<p>Sayın {ad} {soyad},</p>
<p><strong>{kurs_adi}</strong> programına katılımınız için teşekkür ederiz.</p>
<p>Sertifika tarihiniz: {sertifika_tarihi}. PDF sertifikanız bu e-postanın ekinde yer almaktadır.</p>
<p>Doğrulama linki: <a href="{dogrulama_linki}">{dogrulama_linki}</a></p>`;

export function resolveMailSubject(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DEFAULT_MAIL_SUBJECT;
}

export function resolveMailBody(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DEFAULT_MAIL_BODY;
}
