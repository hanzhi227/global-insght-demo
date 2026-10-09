import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Plant documentation assistant', description: 'Answers from the right safety, maintenance, and quality documents.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
