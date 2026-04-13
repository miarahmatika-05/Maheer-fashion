import type { Metadata } from 'next';
import './globals.css';
import '@fontsource-variable/geist';

export const metadata: Metadata = {
  title: 'Maheer Fashion POS',
  description: 'Point of Sale Analytics Dashboard for Maheer Fashion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
