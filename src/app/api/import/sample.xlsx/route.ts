import { generateImportSample } from '@/server/import';
import { requireSession } from '@/server/auth/session';
import { withHandler } from '@/server/http/wrap';
import { binary } from '@/server/http/response';

export const GET = withHandler(async () => {
  await requireSession();
  const buf = generateImportSample();
  return binary(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {
    'Content-Disposition': 'attachment; filename="ornek-ogrenci-listesi.xlsx"',
  });
});
