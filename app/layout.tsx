import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'East Site: Nearest Community Health Posts and Active Ageing Centres',
  description: 'Find the nearest Community Health Post and Active Ageing Centre in Singapore by postal code.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
