import { randomBytes } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

const ALLOWED_EXT = new Set(['.pdf', '.png', '.jpg']);

let root: string | null = null;

function getRoot() {
  if (!root) {
    root = path.resolve(
      process.env.STORAGE_DIR ?? path.join(process.cwd(), 'storage', 'templates'),
    );
  }
  return root;
}

export function resetStorageRootForTests() {
  root = null;
}

function assertCourseId(courseId: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(courseId)) {
    throw new Error('Geçersiz kurs kimliği');
  }
}

function keySegments(key: string): string[] {
  if (!key || key.includes('\0') || key.includes('\\')) {
    throw new Error('Geçersiz depolama anahtarı');
  }
  const parts = key.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Geçersiz depolama anahtarı');
  }
  return parts;
}

function fullPath(key: string): string {
  const resolved = path.resolve(getRoot(), ...keySegments(key));
  const base = getRoot();
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error('Geçersiz depolama anahtarı');
  }
  return resolved;
}

async function removeEmptyParents(fromDir: string) {
  const base = getRoot();
  let dir = fromDir;
  while (dir.startsWith(base + path.sep)) {
    const entries = await fs.readdir(dir);
    if (entries.length) return;
    await fs.rmdir(dir);
    dir = path.dirname(dir);
  }
}

export function unreferencedKeys(onDisk: readonly string[], referenced: ReadonlySet<string>) {
  return onDisk.filter((key) => !referenced.has(key));
}

export const storage = {
  root: getRoot,

  async ensureRoot() {
    await fs.mkdir(getRoot(), { recursive: true });
  },

  async save(courseId: string, buffer: Buffer, ext: string): Promise<string> {
    assertCourseId(courseId);
    if (!ALLOWED_EXT.has(ext)) throw new Error('Geçersiz dosya uzantısı');
    await storage.ensureRoot();
    const key = `${courseId}/${randomBytes(16).toString('hex')}${ext}`;
    const dest = fullPath(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buffer);
    return key;
  },

  async read(key: string): Promise<Buffer> {
    return fs.readFile(fullPath(key));
  },

  async delete(key: string): Promise<void> {
    const dest = fullPath(key);
    try {
      await fs.unlink(dest);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw e;
      return;
    }
    await removeEmptyParents(path.dirname(dest));
  },

  async listFiles(): Promise<string[]> {
    const base = getRoot();
    const found: string[] = [];
    async function walk(dir: string) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw e;
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(abs);
          continue;
        }
        if (!entry.isFile()) continue;
        const rel = path.relative(base, abs).split(path.sep).join('/');
        found.push(rel);
      }
    }
    await walk(base);
    return found;
  },
};
