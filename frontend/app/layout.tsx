import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/common/Navbar";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTA Commuter Buddy | Budget-Constrained Commute Optimization",
  description:
    "Find time-efficient Greater Toronto Area commuter routes within your exact toll budget using Highway 407 ETR and non-toll highways.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200">
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs sm:text-sm">
                GTA Commuter Buddy • Open-Source Constrained Dijkstra Solver
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                Highway 407 ETR light vehicle calculations
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}