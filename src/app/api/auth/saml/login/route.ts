import { NextResponse } from 'next/server';
import { getSamlInstance, isSamlConfigured } from '@/server/auth/saml-config';
import { getPublicBaseUrl } from '@/server/public-base-url';
import { notFound } from '@/server/http/errors';
import { withHandler } from '@/server/http/wrap';

export const GET = withHandler(async () => {
  if (!isSamlConfigured()) {
    throw notFound();
  }
  const saml = getSamlInstance();
  const host = getPublicBaseUrl();
  const url = await saml.getAuthorizeUrlAsync('', host, {});
  return NextResponse.redirect(url);
});
