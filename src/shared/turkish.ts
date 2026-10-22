const TR_LOWER_MAP: Record<string, string> = {
  İ: 'i',
  I: 'ı',
  Ş: 'ş',
  Ğ: 'ğ',
  Ü: 'ü',
  Ö: 'ö',
  Ç: 'ç',
};

const TR_UPPER_MAP: Record<string, string> = {
  i: 'İ',
  ı: 'I',
  ş: 'Ş',
  ğ: 'Ğ',
  ü: 'Ü',
  ö: 'Ö',
  ç: 'Ç',
};

export function trLower(value: string): string {
  return value
    .split('')
    .map((ch) => TR_LOWER_MAP[ch] ?? ch.toLowerCase())
    .join('');
}

export function trUpper(value: string): string {
  return value
    .split('')
    .map((ch) => TR_UPPER_MAP[ch] ?? ch.toUpperCase())
    .join('');
}

export function buildSearchText(parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .map((p) => trLower(String(p).trim()))
    .join(' ');
}

export function maskName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word[0]}***`)
    .join(' ');
}
