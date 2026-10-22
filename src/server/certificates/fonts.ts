import * as fs from 'fs';
import * as path from 'path';
import { badRequest } from '../http/errors';

const FONT_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/;

export function fontsDirectory(): string {
  return path.resolve(process.cwd(), 'assets', 'fonts');
}

export function resolveFontFile(fontKey: string, root = fontsDirectory()): string {
  if (!FONT_KEY.test(fontKey)) throw badRequest('Yazı tipi bulunamadı');
  const base = path.resolve(root);
  const file = path.resolve(base, `${fontKey}.ttf`);
  const relative = path.relative(base, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw badRequest('Yazı tipi bulunamadı');
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw badRequest('Yazı tipi bulunamadı');
  }
  return file;
}
