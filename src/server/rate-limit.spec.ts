import { describe, expect, it } from 'vitest';
import { clientAddress } from './rate-limit';

describe('clientAddress', () => {
  it('uses the address the proxy appended', () => {
    expect(clientAddress('1.1.1.1, 203.0.113.8', true)).toBe('203.0.113.8');
    expect(clientAddress('203.0.113.8', true)).toBe('203.0.113.8');
  });

  it('does not let a missing proxy header open a fresh bucket', () => {
    expect(clientAddress(null, true)).toBe('unknown');
    expect(clientAddress('  ,  ', true)).toBe('unknown');
  });

  it('ignores the header when the proxy is not trusted', () => {
    expect(clientAddress('1.1.1.1, 203.0.113.8', false)).toBe('direct');
    expect(clientAddress('9.9.9.9', false)).toBe('direct');
    expect(clientAddress(null, false)).toBe('direct');
  });
});
