import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { ApiError } from '../http/errors';
import { resolveFontFile } from './fonts';

describe('resolveFontFile', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sertiflow-fonts-'));

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.mkdirSync(root);
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reads a font that sits in the directory', () => {
    fs.writeFileSync(path.join(root, 'NotoSans-Regular.ttf'), 'font');
    expect(resolveFontFile('NotoSans-Regular', root)).toBe(
      path.join(root, 'NotoSans-Regular.ttf'),
    );
  });

  it('rejects a name that leaves the directory', () => {
    expect(() => resolveFontFile('../secrets', root)).toThrow(ApiError);
    expect(() => resolveFontFile('..', root)).toThrow(ApiError);
    expect(() => resolveFontFile('NotoSans-Regular/../../../etc/passwd', root)).toThrow(ApiError);
  });

  it('rejects a name that is not a file in the directory', () => {
    expect(() => resolveFontFile('Missing', root)).toThrow(ApiError);
  });
});
