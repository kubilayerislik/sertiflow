'use client';

import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const yellow = '#f3c500';
  const header = '#001529';

  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#f5f5f5] font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div
            className="w-full max-w-[440px] overflow-hidden rounded-[10px] bg-white text-center shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
            style={{ borderTop: `6px solid ${yellow}` }}
          >
            <div className="px-7 py-10 sm:px-8 sm:py-11">
              <p className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl" style={{ color: header }}>
                Hata
              </p>
              <h1 className="mt-3 text-xl font-bold text-neutral-900 sm:text-2xl">Bir şeyler ters gitti</h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenileyebilir veya daha sonra tekrar
                deneyebilirsiniz.
              </p>
              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: header }}
                >
                  Tekrar dene
                </button>
                <a
                  href="/kurslar"
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800"
                >
                  Kurslara dön
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
