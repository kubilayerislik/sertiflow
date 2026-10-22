export function formatCertificateNo(shortName: string, seq: number): string {
  const width = seq > 9999 ? 5 : 4;
  return `${shortName}-${String(seq).padStart(width, '0')}`;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateVerificationCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function asciiFileName(name: string): string {
  const map: Record<string, string> = {
    ç: 'c',
    Ç: 'C',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    İ: 'I',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
  };
  return name
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}
