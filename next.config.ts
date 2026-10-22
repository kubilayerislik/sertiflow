import type { NextConfig } from 'next';

function contentSecurityPolicy() {
  const dev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    dev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    dev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['argon2', 'fontkit', '@pdfme/pdf-lib', 'xlsx', 'nodemailer'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
