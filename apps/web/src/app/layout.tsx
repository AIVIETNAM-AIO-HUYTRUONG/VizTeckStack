import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeToggle } from '../components/ThemeToggle';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VizTeckStack — Public Roadmaps',
  description: 'Browse and explore technology learning roadmaps',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-[var(--bg-0)] text-[var(--text-1)]`}
      >
        <header
          style={{
            background: 'var(--bg-1)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a
            href="/"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--text-1)',
              textDecoration: 'none',
            }}
          >
            VizTeckStack
          </a>
          <ThemeToggle />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
