import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Barlow_Semi_Condensed } from 'next/font/google';
import './globals.css';

// Body: designed for legibility at reading size, which the answers and cited
// excerpts depend on. Display: a condensed industrial grotesk for outlines,
// headings, and status labels. Both are self-hosted by next/font at build time.
const bodyFace = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body', display: 'swap' });
const displayFace = Barlow_Semi_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = { title: 'Plant documentation assistant', description: 'Answers from the right safety, maintenance, quality, and operations documents.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFace.variable} ${displayFace.variable}`}>
      <body>{children}</body>
    </html>
  );
}
