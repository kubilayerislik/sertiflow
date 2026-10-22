export type ZodFlattened = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

export const FIELD_LABELS: Record<string, string> = {
  email: 'E-posta',
  password: 'Parola',
  currentPassword: 'Mevcut parola',
  newPassword: 'Yeni parola',
  fullName: 'Ad soyad',
  firstName: 'Ad',
  lastName: 'Soyad',
  studentNo: 'Öğrenci no',
  certificateDate: 'Sertifika tarihi',
  name: 'Kurs adı',
  shortName: 'Kısa ad',
  description: 'Açıklama',
  startDate: 'Başlangıç tarihi',
  endDate: 'Bitiş tarihi',
  mailSubject: 'E-posta konu',
  mailBody: 'E-posta içerik',
  fieldType: 'Alan tipi',
  SIGNATURE: 'Yetkili imza',
  x: 'X konumu',
  y: 'Y konumu',
  width: 'Genişlik',
  height: 'Yükseklik',
  fontKey: 'Yazı tipi',
  fontSize: 'Punto',
  minFontSize: 'Min punto',
  color: 'Renk',
  align: 'Hizalama',
  dateFormat: 'Tarih biçimi',
  staticText: 'Sabit metin',
  fields: 'Alanlar',
  rows: 'Satırlar',
};

function labelForPath(path: string): string {
  const parts = path.split('.');
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts.length >= 2) {
    const parent = parts[parts.length - 2];
    const parentLabel = FIELD_LABELS[parent] ?? parent;
    const index = Number(last) + 1;
    if (parent === 'fields') {
      const sub = parts[parts.length];
      if (sub && FIELD_LABELS[sub]) {
        return `Alan ${index} — ${FIELD_LABELS[sub]}`;
      }
      return `Alan ${index}`;
    }
    if (parent === 'rows') return `Satır ${index}`;
    return `${parentLabel} (${index})`;
  }
  if (parts.length >= 3 && parts[0] === 'fields' && /^\d+$/.test(parts[1])) {
    const sub = parts[2];
    const subLabel = FIELD_LABELS[sub] ?? sub;
    return `Alan ${Number(parts[1]) + 1} — ${subLabel}`;
  }
  return FIELD_LABELS[last] ?? last;
}

function formatFieldLine(path: string, message: string): string {
  const label = labelForPath(path);
  if (message.startsWith(label)) return message;
  return `${label}: ${message}`;
}

export function formatZodFlatten(flat: ZodFlattened, maxLines = 3): string {
  const lines: string[] = [];
  for (const err of flat.formErrors) {
    lines.push(err);
  }
  for (const [path, messages] of Object.entries(flat.fieldErrors)) {
    if (!messages) continue;
    for (const msg of messages) {
      lines.push(formatFieldLine(path, msg));
    }
  }
  if (lines.length === 0) return 'Girilen bilgiler geçersiz';
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    shown.push(`…ve ${lines.length - maxLines} hata daha`);
  }
  return shown.join('; ');
}
