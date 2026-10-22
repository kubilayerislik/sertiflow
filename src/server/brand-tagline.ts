export function readBrandTagline(): string {
  const value = process.env['BRAND_TAGLINE'];
  return typeof value === 'string' ? value.trim() : '';
}
