import { describe, expect, it } from 'vitest';
import { signatureImageKind } from './signature-image';

describe('signatureImageKind', () => {
  it('recognizes PNG and JPEG signatures', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(signatureImageKind(png)).toBe('png');
    expect(signatureImageKind(jpeg)).toBe('jpeg');
  });

  it('rejects a file that only claims an image type', () => {
    expect(signatureImageKind(Buffer.from('not an image'))).toBeNull();
    expect(signatureImageKind(Buffer.from([0x89, 0x50, 0x4e]))).toBeNull();
  });
});
