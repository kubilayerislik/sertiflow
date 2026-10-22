export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}

export interface MailTransport {
  send(input: SendMailInput): Promise<void>;
  verify?(): Promise<void>;
}
