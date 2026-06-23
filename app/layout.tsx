import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareerForge - Temukan Pekerjaan Impian Anda',
  description: 'Platform pencarian lowongan kerja terpercaya dengan berbagai pilihan industri',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CareerForge',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
