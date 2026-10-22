import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatZodFlatten } from '@/shared';
import { ApiError } from './errors';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function binary(
  body: Buffer | Uint8Array,
  contentType: string,
  headers?: Record<string, string>,
) {
  const data = new Uint8Array(body);
  return new NextResponse(data as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      ...headers,
    },
  });
}

export function handleApiError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json(e.body, { status: e.status });
  }
  if (e instanceof ZodError) {
    const flat = e.flatten();
    return NextResponse.json(
      { message: formatZodFlatten(flat), fieldErrors: flat.fieldErrors, formErrors: flat.formErrors },
      { status: 400 },
    );
  }
  console.error(e);
  return NextResponse.json({ message: 'Sunucu hatası' }, { status: 500 });
}
