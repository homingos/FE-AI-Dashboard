// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // <-- 1. Import the 'Inter' font from next/font
import './globals.css';

// 2. Initialize the font with desired subsets (e.g., 'latin' for English/European languages)
const inter = Inter({ subsets: ['latin'] });

// Your metadata is already well-defined! No changes needed here.
export const metadata: Metadata = {
  title: 'Flam AI Dashboard',
  description: 'One-stop hub to explore, interact with, and deploy powerful AI models',
  generator: 'Vinayak',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font's className to the <body> tag for optimization */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}