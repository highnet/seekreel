import type { Metadata, Viewport } from 'next';
import { Anybody, Martian_Mono } from 'next/font/google';
import './globals.css';

/*
 * Anybody carries the voice on its width axis — the wordmark runs wide, the
 * headings sit a little narrower. Martian Mono is not costume here: every
 * number on this page is a frame index or a timestamp, and they have to line
 * up in a column.
 */
const anybody = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-anybody',
});

const martian = Martian_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-martian',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://seekreel.vercel.app'),
  title: 'seekreel — render an animated web page to video, one frame at a time',
  description:
    'seekreel asks a web page to draw itself at every timestamp in a film, screenshots each one, and hands the stack to ffmpeg. Deterministic frames, re-renderable shots, a film that rebuilds in CI.',
  keywords: ['video', 'animation', 'gsap', 'playwright', 'ffmpeg', 'mp4', 'deterministic rendering'],
  authors: [{ name: 'highnet', url: 'https://highnet.at' }],
  openGraph: {
    title: 'seekreel',
    description: 'Render an animated web page to video, one frame at a time.',
    url: 'https://seekreel.vercel.app',
    siteName: 'seekreel',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'seekreel',
    description: 'Render an animated web page to video, one frame at a time.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ba2997',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${martian.variable}`}>
      <body>{children}</body>
    </html>
  );
}
