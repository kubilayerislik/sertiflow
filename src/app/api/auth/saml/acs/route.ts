import { NextResponse } from 'next/server';
import { loginFromSamlAssertion, samlRedirectErrorMessage } from '@/server/auth/saml-auth';
import { issueSamlCompleteCode } from '@/server/auth/saml-complete-codes';
import { getSamlInstance, isSamlConfigured } from '@/server/auth/saml-config';
import { getPublicBaseUrl } from '@/server/public-base-url';

function loginErrorRedirect(message: string) {
  const base = getPublicBaseUrl();
  const url = new URL('/giris', base);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url.toString(), 303);
}

export async function POST(request: Request) {
  if (!isSamlConfigured()) {
    return loginErrorRedirect('SAML yapılandırması eksik');
  }
  try {
    const form = await request.formData();
    const samlResponse = form.get('SAMLResponse');
    if (typeof samlResponse !== 'string') {
      return loginErrorRedirect('Geçersiz SAML yanıtı');
    }
    const saml = getSamlInstance();
    const { profile } = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });
    const user = await loginFromSamlAssertion(profile as Record<string, unknown>);
    const code = issueSamlCompleteCode(user);
    const completeUrl = new URL('/api/auth/saml/complete', getPublicBaseUrl());
    completeUrl.searchParams.set('code', code);
    return NextResponse.redirect(completeUrl.toString(), 303);
  } catch (e) {
    return loginErrorRedirect(samlRedirectErrorMessage(e));
  }
}
