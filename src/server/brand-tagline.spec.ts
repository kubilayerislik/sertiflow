import { afterEach, describe, expect, it } from 'vitest';
import { readBrandTagline } from './brand-tagline';

describe('readBrandTagline', () => {
  const previous = process.env.BRAND_TAGLINE;

  afterEach(() => {
    if (previous === undefined) delete process.env.BRAND_TAGLINE;
    else process.env.BRAND_TAGLINE = previous;
  });

  it('returns a trimmed line', () => {
    process.env.BRAND_TAGLINE = '  Örnek Kurum  ';
    expect(readBrandTagline()).toBe('Örnek Kurum');
  });

  it('returns empty when unset or blank', () => {
    delete process.env.BRAND_TAGLINE;
    expect(readBrandTagline()).toBe('');
    process.env.BRAND_TAGLINE = '   ';
    expect(readBrandTagline()).toBe('');
  });
});
