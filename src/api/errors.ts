import { formatZodFlatten, type ZodFlattened } from '@/shared';

function messageFromData(data: Record<string, unknown>): string | null {
  const msg = data.message;
  if (typeof msg === 'string' && msg.length > 0) return msg;
  if (typeof msg === 'object' && msg !== null) {
    const nested = msg as { message?: unknown; restoreId?: string };
    if (typeof nested.message === 'string' && nested.message.length > 0) {
      return nested.message;
    }
  }
  const fieldErrors = data.fieldErrors as Record<string, string[]> | undefined;
  const formErrors = data.formErrors as string[] | undefined;
  if (fieldErrors || formErrors) {
    return formatZodFlatten({
      formErrors: formErrors ?? [],
      fieldErrors: fieldErrors ?? {},
    });
  }
  if (typeof msg === 'object' && msg !== null) {
    const flat = msg as ZodFlattened;
    if (flat.fieldErrors || flat.formErrors) {
      return formatZodFlatten({
        formErrors: flat.formErrors ?? [],
        fieldErrors: flat.fieldErrors ?? {},
      });
    }
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'İstek başarısız';
  const status = (error as Error & { status?: number }).status;
  const data = (error as Error & { data?: unknown }).data;

  if (typeof data === 'object' && data !== null) {
    const fromData = messageFromData(data as Record<string, unknown>);
    if (fromData) return fromData;
  }

  if (error.message && error.message !== 'İstek başarısız') {
    return error.message;
  }

  if (status === 401) return 'Oturum gerekli veya giriş bilgileri hatalı';
  if (status === 403) return 'Bu işlem için yetkiniz yok';
  if (status === 404) return 'Kayıt bulunamadı';
  if (status === 409) return 'Kayıt çakışması; bilgileri kontrol edin';

  return error.message || 'İstek başarısız';
}

export async function errorFromResponse(res: Response): Promise<Error & { status: number; data: unknown }> {
  const err = await res.json().catch(() => ({}));
  const data =
    err.message && typeof err.message === 'object' ? err.message : err;
  const summary =
    typeof err.message === 'string'
      ? err.message
      : typeof (data as { message?: string })?.message === 'string'
        ? (data as { message: string }).message
        : 'İstek başarısız';
  return Object.assign(new Error(summary), { status: res.status, data });
}
