import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { RootConvexProvider } from '@/components/platform/RootConvexProvider';
import { RootAuthProvider } from '@/components/platform/RootAuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Find Accommodation | Holiday Properties & Guest Houses in South Africa',
    template: '%s | Find Accommodation',
  },
  description: 'Find and book holiday accommodations across South Africa. Commission-based platform showcasing guest houses, holiday homes, lodges, and more. No setup costs for property owners.',
  keywords: [
    'accommodation South Africa',
    'holiday accommodation',
    'guest house South Africa',
    'holiday homes',
    'lodges',
    'self-catering accommodation',
    'vacation rentals',
    'Find Accommodation',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    title: 'Find Accommodation | Holiday Properties & Guest Houses in South Africa',
    description: 'Find and book holiday accommodations across South Africa.',
    siteName: 'Find Accommodation',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorHandler />
        <RootConvexProvider>
          <RootAuthProvider>
            <CurrencyProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </CurrencyProvider>
          </RootAuthProvider>
        </RootConvexProvider>
      </body>
    </html>
  );
}
