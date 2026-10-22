import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { resetStorageRootForTests, storage, unreferencedKeys } from './storage';

let dir: string | null = null;

afterEach(async () => {
  resetStorageRootForTests();
  delete process.env.STORAGE_DIR;
  if (dir) await fs.rm(dir, { recursive: true, force: true });
  dir = null;
});

async function useTempRoot() {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sertiflow-storage-'));
  process.env.STORAGE_DIR = dir;
  resetStorageRootForTests();
}

describe('storage', () => {
  it('şablonu kurs klasörüne yazar ve boş klasörü siler', async () => {
    await useTempRoot();
    const key = await storage.save('kurs1', Buffer.from('%PDF'), '.pdf');
    expect(key.startsWith('kurs1/')).toBe(true);
    expect(key.endsWith('.pdf')).toBe(true);
    await expect(storage.read(key)).resolves.toEqual(Buffer.from('%PDF'));
    await storage.delete(key);
    await expect(fs.readdir(dir!)).resolves.toEqual([]);
  });

  it('kökün dışına çıkan anahtarı reddeder', async () => {
    await useTempRoot();
    await expect(storage.read('../.env')).rejects.toThrow('Geçersiz depolama anahtarı');
    await expect(storage.save('../etc', Buffer.from('x'), '.pdf')).rejects.toThrow(
      'Geçersiz kurs kimliği',
    );
  });

  it('veritabanında kaydı olmayan dosyayı artık sayar', () => {
    const live = new Set(['kurs1/a.pdf']);
    expect(unreferencedKeys(['kurs1/a.pdf', 'kurs1/eski.pdf', 'orphan.pdf'], live)).toEqual([
      'kurs1/eski.pdf',
      'orphan.pdf',
    ]);
  });
});
