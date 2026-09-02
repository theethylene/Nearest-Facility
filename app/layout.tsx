import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nearest Community Health Post',
  description: 'Find the nearest Community Health Post in Singapore by postal code.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
