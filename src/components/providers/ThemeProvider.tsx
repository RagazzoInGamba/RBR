/**
 * Red Bull Racing - Theme Provider
 * Professional theme management using next-themes
 * Best practice 2025 for Next.js 15 + React 19
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  [key: string]: unknown;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="rbr-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

