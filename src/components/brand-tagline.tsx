'use client';

import { createContext, useContext } from 'react';

const BrandTaglineContext = createContext('');

export function BrandTaglineProvider({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <BrandTaglineContext.Provider value={value}>{children}</BrandTaglineContext.Provider>;
}

export function useBrandTagline() {
  return useContext(BrandTaglineContext);
}
