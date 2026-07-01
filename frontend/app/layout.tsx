import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeProvider } from '@/components/site/theme-provider';

export const metadata: Metadata = {
  title: 'SmartQueue AI',
  description: 'Premium AI queue management for modern organizations.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
