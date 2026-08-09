import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Afterlight',
  description: 'You are not the only one under this sky.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
