import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import Popups from '@/components/Popups';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Lani',
  description: 'Your AI shopping assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={nunito.variable}>
        {children}
        <Popups />
      </body>
    </html>
  );
}
