import { isSamlConfigured } from '@/server/auth/saml-config';
import { getEnv } from '@/server/config/env';
import { getPublicBaseUrl } from '@/server/public-base-url';
import { withHandler } from '@/server/http/wrap';
import { json } from '@/server/http/response';

export const GET = withHandler(async () => {
  const env = getEnv();
  return json({
    mailEnabled: env.MAIL_ENABLED === true,
    publicBaseUrl: getPublicBaseUrl(),
    passwordLogin: env.NODE_ENV !== 'production',
    samlConfigured: isSamlConfigured(),
  });
});
