import { getSamlInstance, isSamlConfigured } from '@/server/auth/saml-config';
import { notFound } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';

export const GET = withHandler(async () => {
  if (!isSamlConfigured()) {
    throw notFound();
  }
  const saml = getSamlInstance();
  const xml = saml.generateServiceProviderMetadata(null);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
});
