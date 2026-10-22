import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../http/errors';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../db/prisma', () => ({
  getPrisma: () => prismaMock,
}));

vi.mock('../config/env', () => ({
  getEnv: () => ({ SAML_EMAIL_ATTRIBUTE: undefined }),
}));

import { loginFromSamlAssertion, samlRedirectErrorMessage, SAML_LOGIN_REJECTED } from './saml-auth';

describe('loginFromSamlAssertion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows active registered user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'person@sertiflow.com',
      fullName: 'Test',
      role: 'USER',
      isActive: true,
    });
    prismaMock.user.update.mockResolvedValue({});
    const user = await loginFromSamlAssertion({
      email: 'person@sertiflow.com',
    });
    expect(user.email).toBe('person@sertiflow.com');
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('rejects unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      loginFromSamlAssertion({ email: 'unknown@sertiflow.com' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects missing email', async () => {
    await expect(loginFromSamlAssertion({})).rejects.toMatchObject({ status: 401 });
  });

  it('rejects inactive user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'person@sertiflow.com',
      fullName: 'Test',
      role: 'USER',
      isActive: false,
    });
    await expect(
      loginFromSamlAssertion({ email: 'person@sertiflow.com' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe('samlRedirectErrorMessage', () => {
  it('keeps our own message and hides library text', () => {
    const own = new ApiError(403, 'Hesabınız sisteme tanımlı değil veya pasif');
    expect(samlRedirectErrorMessage(own)).toBe(own.message);

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(samlRedirectErrorMessage(new Error('Invalid signature, cert=SECRET'))).toBe(
      SAML_LOGIN_REJECTED,
    );
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
