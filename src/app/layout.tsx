import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marble Analyst - Blok Takip',
  description: 'Mermer blok takip ve maliyet analiz sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
