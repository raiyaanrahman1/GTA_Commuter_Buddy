import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTA Commuter Buddy",
  description: "A mapping app for commuters in the Greater Toronto Area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="w-screen h-screen flex flex-col">
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
