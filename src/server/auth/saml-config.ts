import { SAML } from '@node-saml/node-saml';
import { getEnv } from '../config/env';
import { getPublicBaseUrl } from '../public-base-url';

function normalizeCert(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN CERTIFICATE')) {
    return trimmed;
  }
  const body = trimmed.replace(/\s/g, '');
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

export function isSamlConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.SAML_SP_ENTITY_ID &&
      env.SAML_IDP_ENTITY_ID &&
      env.SAML_IDP_SSO_URL &&
      env.SAML_IDP_CERT,
  );
}

export function getSamlInstance(): SAML {
  const env = getEnv();
  if (!isSamlConfigured()) {
    throw new Error('SAML yapılandırması eksik');
  }
  const base = getPublicBaseUrl();
  return new SAML({
    issuer: env.SAML_SP_ENTITY_ID!,
    callbackUrl: `${base}/api/auth/saml/acs`,
    idpIssuer: env.SAML_IDP_ENTITY_ID!,
    entryPoint: env.SAML_IDP_SSO_URL!,
    idpCert: normalizeCert(env.SAML_IDP_CERT!),
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: false,
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  });
}
