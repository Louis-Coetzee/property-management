import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { RootConvexProvider } from '@/components/platform/RootConvexProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Find Accommodation',
  description: 'Your trusted platform for finding and listing holiday accommodation across South Africa'};

export default function RootLayout({
  children}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorHandler />
        <RootConvexProvider>
          <CurrencyProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </CurrencyProvider>
        </RootConvexProvider>
      </body>
    </html>
  );
}
