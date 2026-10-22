import { badRequest } from './errors';

export async function readFormFile(
  formData: FormData,
  field: string,
  maxBytes: number,
): Promise<{ buffer: Buffer; fileName?: string; mime?: string }> {
  const file = formData.get(field);
  if (!file || !(file instanceof File)) throw badRequest('Dosya gerekli');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > maxBytes) throw badRequest('Dosya çok büyük');
  return { buffer, fileName: file.name, mime: file.type };
}
