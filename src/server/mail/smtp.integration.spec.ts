import * as net from 'net';
import { afterEach, describe, expect, it } from 'vitest';

function listenSmtp(): Promise<{ port: number; stop: () => Promise<void>; body: () => string }> {
  const chunks: Buffer[] = [];
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 localhost ESMTP\r\n');
    let collecting = false;
    let pending = '';
    socket.on('data', (chunk) => {
      chunks.push(chunk);
      pending += chunk.toString('utf8');
      if (collecting) {
        if (!pending.includes('\r\n.\r\n')) return;
        collecting = false;
        pending = '';
        socket.write('250 accepted\r\n');
        return;
      }
      const lines = pending.split('\r\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        const command = line.toUpperCase();
        if (command.startsWith('EHLO') || command.startsWith('HELO')) {
          socket.write('250 localhost\r\n');
        } else if (command === 'DATA') {
          collecting = true;
          socket.write('354 continue\r\n');
        } else if (command === 'QUIT') {
          socket.write('221 bye\r\n');
          socket.end();
        } else {
          socket.write('250 OK\r\n');
        }
      }
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('SMTP portu alınamadı'));
        return;
      }
      resolve({
        port: address.port,
        stop: () =>
          new Promise((done) => {
            for (const socket of sockets) socket.destroy();
            server.close(() => done());
          }),
        body: () => Buffer.concat(chunks).toString('utf8'),
      });
    });
  });
}

describe('SmtpTransport', () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_REQUIRE_TLS: process.env.SMTP_REQUIRE_TLS,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    MAIL_FROM: process.env.MAIL_FROM,
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  };
  let stop: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await stop?.();
    stop = undefined;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('delivers a message to an SMTP server', async () => {
    const smtp = await listenSmtp();
    stop = smtp.stop;
    process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:5432/unused';
    process.env.SESSION_SECRET = 'integration-session-secret-32-characters';
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = String(smtp.port);
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_REQUIRE_TLS = 'false';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.MAIL_FROM = 'sertiflow@sertiflow.com';
    process.env.MAIL_FROM_NAME = 'Sertiflow';

    const { resetEnvCache } = await import('../config/env');
    resetEnvCache();
    const { SmtpTransport } = await import('./smtp.transport');
    const transport = new SmtpTransport();
    await transport.send({
      to: 'ogrenci@example.com',
      subject: 'Sertiflow test maili',
      html: '<p>SMTP yapılandırması çalışıyor.</p>',
      text: 'SMTP yapılandırması çalışıyor.',
    });

    const received = smtp.body();
    expect(received).toContain('Subject: Sertiflow test maili');
    expect(received).toContain('To: ogrenci@example.com');
    expect(received).toContain('text/plain');
  });
});
