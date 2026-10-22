import * as fontkit from 'fontkit';
import * as fs from 'fs';
import { resolveFontFile } from './fonts';

export function fieldBoxInPdf(
  field: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number,
) {
  const width = field.width * pageWidth;
  const height = field.height * pageHeight;
  const left = field.x * pageWidth;
  const bottom = pageHeight - (field.y + field.height) * pageHeight;
  const top = pageHeight - field.y * pageHeight;
  return { left, bottom, top, width, height };
}

type FontVertMetrics = { unitsPerEm: number; descent: number };
const fontMetricsCache = new Map<string, FontVertMetrics>();

function getFontVertMetrics(fontKey: string): FontVertMetrics {
  const cached = fontMetricsCache.get(fontKey);
  if (cached) return cached;
  const file = resolveFontFile(fontKey);
  const font = fontkit.create(fs.readFileSync(file));
  const m = { unitsPerEm: font.unitsPerEm, descent: font.descent };
  fontMetricsCache.set(fontKey, m);
  return m;
}

export function textBaselinesInBox(
  boxBottom: number,
  boxHeight: number,
  lineCount: number,
  fontSize: number,
  lineHeightFactor = 1.2,
  fontKey?: string,
): number[] {
  const lineHeight = fontSize * lineHeightFactor;
  const blockHeight = lineCount * lineHeight;
  const pad = (boxHeight - blockHeight) / 2;
  const leadingBelow = (lineHeight - fontSize) / 2;
  let belowLineBox = leadingBelow;
  if (fontKey) {
    const m = getFontVertMetrics(fontKey);
    const scale = fontSize / m.unitsPerEm;
    belowLineBox += Math.abs(m.descent) * scale;
  } else {
    belowLineBox += fontSize * 0.35;
  }
  const bottomLineBaseline = boxBottom + pad + belowLineBox;
  return Array.from(
    { length: lineCount },
    (_, i) => bottomLineBaseline + (lineCount - 1 - i) * lineHeight,
  );
}
