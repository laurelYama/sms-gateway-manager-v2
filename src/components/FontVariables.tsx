'use client';

import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function FontVariables() {
  return (
    <style jsx global>{`
      :root {
        --font-geist-sans: ${geistSans.style.fontFamily};
        --font-geist-mono: ${geistMono.style.fontFamily};
      }
    `}</style>
  );
}
