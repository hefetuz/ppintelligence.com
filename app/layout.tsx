import type { Metadata } from 'next';
import './globals.css';
import { pageMeta } from './site/content';

export const metadata: Metadata = {
  ...pageMeta['/'],
  icons: { icon: '/pp-logo.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
