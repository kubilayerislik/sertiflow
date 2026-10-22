'use client';

import Link from 'next/link';
import { BRAND_NAME } from '../brand';
import { useBrandTagline } from './brand-tagline';
import {
  SertiflowLogoDark,
  SertiflowLogoLight,
  SertiflowMark,
} from './brand/SertiflowLogoSvg';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  variant?: 'light' | 'dark' | 'mark';
  height?: number;
  linkToHome?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = 'light',
  height = 36,
  linkToHome = true,
  className,
}: BrandLogoProps) {
  const tagline = useBrandTagline();
  const label = tagline ? `${BRAND_NAME}, ${tagline}` : BRAND_NAME;
  const graphic =
    variant === 'mark' ? (
      <SertiflowMark height={height} />
    ) : variant === 'light' ? (
      <SertiflowLogoLight height={height} tagline={tagline} />
    ) : (
      <SertiflowLogoDark height={height} tagline={tagline} />
    );

  const content = (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex max-w-full items-center leading-none', className)}
    >
      {graphic}
    </span>
  );

  if (!linkToHome) return content;

  return (
    <Link href="/kurslar" className={cn('inline-flex shrink-0 items-center leading-none no-underline')}>
      {content}
    </Link>
  );
}
