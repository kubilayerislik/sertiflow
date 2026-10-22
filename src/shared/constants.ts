export const FIELD_TYPES = [
  'FULL_NAME',
  'FIRST_NAME',
  'LAST_NAME',
  'STUDENT_NO',
  'CERTIFICATE_NO',
  'COURSE_NAME',
  'CERTIFICATE_DATE',
  'COURSE_START',
  'COURSE_END',
  'VERIFICATION_CODE',
  'QR_CODE',
  'SIGNATURE',
  'STATIC_TEXT',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const MAIL_STATUSES = ['QUEUED', 'SENDING', 'SENT', 'FAILED'] as const;
export type MailStatus = (typeof MAIL_STATUSES)[number];

export const MAIL_BATCH_STATUSES = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const;
export type MailBatchStatus = (typeof MAIL_BATCH_STATUSES)[number];

export const TEXT_ALIGNS = ['left', 'center', 'right'] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

export const DATE_FORMATS = ['DD.MM.YYYY', 'D MMMM YYYY'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const SHORT_NAME_REGEX = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const SHORT_NAME_MAX_LENGTH = 20;
