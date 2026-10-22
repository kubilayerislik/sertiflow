import type { EditorField } from './TemplateTab';

const DATE_FIELD_TYPES = new Set(['CERTIFICATE_DATE', 'COURSE_START', 'COURSE_END']);

export function serializeTemplateFields(fields: EditorField[]) {
  return fields.map((f) => ({
    fieldType: f.fieldType,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    fontKey: f.fontKey,
    fontSize: f.fontSize,
    minFontSize: Math.min(f.minFontSize, f.fontSize),
    color: /^#[0-9A-Fa-f]{6}$/.test(f.color) ? f.color : '#000000',
    align: f.align === 'left' || f.align === 'right' ? f.align : 'center',
    ...(DATE_FIELD_TYPES.has(f.fieldType)
      ? { dateFormat: f.dateFormat ?? 'DD.MM.YYYY' }
      : {}),
    ...(f.fieldType === 'STATIC_TEXT' && f.staticText ? { staticText: f.staticText } : {}),
    uppercase: Boolean(f.uppercase),
  }));
}
