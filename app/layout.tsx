import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deniz K. Tudor',
  description: 'Deniz K. Tudor — an exploration of human connection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        {children}
      </body>
    </html>
  );
}
