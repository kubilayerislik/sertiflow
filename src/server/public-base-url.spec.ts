import { afterEach, describe, expect, it } from 'vitest';
import { getPublicBaseUrl } from './public-base-url';

describe('getPublicBaseUrl', () => {
  const previousUrl = process.env.PUBLIC_BASE_URL;
  const previousEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = previousUrl;
    (process.env as { NODE_ENV?: string }).NODE_ENV = previousEnv;
  });

  it('strips a trailing slash', () => {
    process.env.PUBLIC_BASE_URL = 'https://sertifika.example/';
    expect(getPublicBaseUrl()).toBe('https://sertifika.example');
  });

  it('uses localhost in development when unset', () => {
    delete process.env.PUBLIC_BASE_URL;
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    process.env.PORT = '3000';
    expect(getPublicBaseUrl()).toBe('http://localhost:3000');
  });

  it('throws outside development when unset', () => {
    delete process.env.PUBLIC_BASE_URL;
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    expect(() => getPublicBaseUrl()).toThrow('PUBLIC_BASE_URL gerekli');
  });
});
