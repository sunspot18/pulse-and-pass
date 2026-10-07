import type { Metadata, Viewport } from 'next';
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { ToastProvider } from '../components/Toast';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pulse & Pass | Digital Box Office & Gate Admission',
  description:
    'Live event discovery, instant tier reservation, and digital perforated admission passes.',
  keywords: ['ticketing', 'events', 'box office', 'qr admission', 'gate pass'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F5EFE6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">
          Skip to Admission Content [TAB]
        </a>
        <ToastProvider>
          <main id="main-content" className="content-wrapper">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
