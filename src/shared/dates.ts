export function toUtcDateOnly(input: Date | string): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function formatUtcDate(date: Date, format: 'DD.MM.YYYY' | 'D MMMM YYYY'): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  if (format === 'DD.MM.YYYY') {
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${dd}.${mm}.${year}`;
  }
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  return `${day} ${months[month]} ${year}`;
}
