import type { Metadata } from 'next';
import './globals.css';
import './hero-polish.css';

export const metadata: Metadata = {
  title: 'Pretty Penny Intelligence | Strategy, Risk & Growth',
  description: 'Strategy, risk and technology advisory with Deniz K. Tudor. Helping startups, growing businesses and financial institutions cut costs and move forward.',
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
