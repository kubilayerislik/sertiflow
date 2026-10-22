import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Providers } from '@/components/Providers';
import { readBrandTagline } from '@/server/brand-tagline';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Sertiflow',
  description: 'Sertifika yönetim sistemi',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const brandTagline = readBrandTagline();
  return (
    <html lang="tr" className={cn("font-sans", geist.variable)}>
      <body>
        <Providers brandTagline={brandTagline}>{children}</Providers>
      </body>
    </html>
  );
}
