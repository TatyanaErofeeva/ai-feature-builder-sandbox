import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import { AppProviders } from './providers/AppProviders';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Feature Builder Sandbox',
  description: 'Sandbox for building FSD features with code streaming and an isolated preview',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable} h-full`}>
      <body className="h-full bg-[#0b0f14] font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
