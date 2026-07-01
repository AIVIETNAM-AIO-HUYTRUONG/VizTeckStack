import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { WebApolloProvider } from '../components/ApolloProvider';
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

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            id="theme-init"
            dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();` }}
          />
        </head>
        <body className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} bg-bg-0 text-text-1`}>
          <WebApolloProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg-1 focus:text-indigo focus:border focus:border-indigo focus:rounded-sm focus:text-sm focus:font-semibold"
            >
              Skip to content
            </a>
            {children}
          </WebApolloProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
