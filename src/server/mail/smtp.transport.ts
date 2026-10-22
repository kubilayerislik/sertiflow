import * as nodemailer from 'nodemailer';
import { getEnv } from '../config/env';
import { MailTransport, SendMailInput } from './mail-transport.interface';

export class SmtpTransport implements MailTransport {
  private transporter: nodemailer.Transporter;

  constructor() {
    const env = getEnv();
    const host = env.SMTP_HOST ?? 'localhost';
    const port = env.SMTP_PORT ?? 1025;
    const secure = env.SMTP_SECURE ?? false;
    const auth =
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: env.SMTP_REQUIRE_TLS ?? false,
      auth,
      pool: true,
      maxConnections: 3,
    });
  }

  async verify(): Promise<void> {
    await this.transporter.verify();
  }

  async send(input: SendMailInput): Promise<void> {
    const env = getEnv();
    const from = env.MAIL_FROM ?? 'sertiflow@sertiflow.com';
    const fromName = env.MAIL_FROM_NAME;
    const fromHeader = fromName ? `"${fromName}" <${from}>` : from;

    await this.transporter.sendMail({
      from: fromHeader,
      replyTo: env.MAIL_REPLY_TO ?? from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  }
}

export function isRetryableSmtpError(message: string): boolean {
  const lower = message.toLowerCase();
  if (/5\d{2}/.test(message) || lower.includes('permanent')) return false;
  if (/4\d{2}/.test(message) || lower.includes('timeout') || lower.includes('econnrefused')) {
    return true;
  }
  return true;
}
