import { ZodSchema } from 'zod';
import { ApiError } from './errors';

export function parseBody<T>(schema: ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export async function readJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json().catch(() => {
    throw new ApiError(400, 'Geçersiz JSON');
  });
  return parseBody(schema, body);
}
